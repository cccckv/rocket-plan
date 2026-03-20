import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import OSS from 'ali-oss';
import { v4 as uuidv4 } from 'uuid';
import { LocalStorageService } from './local-storage.service';

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly provider: 's3' | 'oss' | 'local';
  private s3Client?: S3Client;
  private ossClient?: OSS;
  private localStorage?: LocalStorageService;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get<'s3' | 'oss' | 'local'>('STORAGE_PROVIDER', 'local');
    this.bucket = '';

    if (this.provider === 's3') {
      this.initS3();
    } else if (this.provider === 'oss') {
      this.initOSS();
    } else if (this.provider === 'local') {
      this.initLocal();
    }
  }

  private initLocal() {
    this.localStorage = new LocalStorageService(this.configService);
    this.bucket = 'local';
    this.logger.log('Local storage initialized');
  }

  private initS3() {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET', '');

    if (!region || !accessKeyId || !secretAccessKey || !this.bucket) {
      this.logger.warn('AWS S3 credentials not configured');
      return;
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log(`AWS S3 client initialized (region: ${region}, bucket: ${this.bucket})`);
  }

  private initOSS() {
    const region = this.configService.get<string>('OSS_REGION');
    const accessKeyId = this.configService.get<string>('OSS_ACCESS_KEY_ID');
    const accessKeySecret = this.configService.get<string>('OSS_ACCESS_KEY_SECRET');
    this.bucket = this.configService.get<string>('OSS_BUCKET', '');

    if (!region || !accessKeyId || !accessKeySecret || !this.bucket) {
      this.logger.warn('Alibaba Cloud OSS credentials not configured');
      return;
    }

    this.ossClient = new OSS({
      region,
      accessKeyId,
      accessKeySecret,
      bucket: this.bucket,
    });

    this.logger.log(`Alibaba Cloud OSS client initialized (region: ${region}, bucket: ${this.bucket})`);
  }

  async upload(
    file: Express.Multer.File,
    folder: 'materials' | 'videos' | 'bgm' | 'templates',
  ): Promise<UploadResult> {
    if (this.provider === 'local') {
      return this.localStorage!.upload(file, folder);
    }

    const ext = file.originalname.split('.').pop();
    const key = `${folder}/${uuidv4()}.${ext}`;

    if (this.provider === 's3') {
      return this.uploadToS3(file, key);
    } else if (this.provider === 'oss') {
      return this.uploadToOSS(file, key);
    }

    throw new BadRequestException('Storage provider not configured');
  }

  private async uploadToS3(file: Express.Multer.File, key: string): Promise<UploadResult> {
    if (!this.s3Client) {
      throw new BadRequestException('S3 client not initialized');
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    const url = `https://${this.bucket}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;

    this.logger.log(`File uploaded to S3: ${key}`);

    return {
      key,
      url,
      bucket: this.bucket,
      size: file.size,
    };
  }

  private async uploadToOSS(file: Express.Multer.File, key: string): Promise<UploadResult> {
    if (!this.ossClient) {
      throw new BadRequestException('OSS client not initialized');
    }

    const result = await this.ossClient.put(key, file.buffer, {
      mime: file.mimetype,
    });

    this.logger.log(`File uploaded to OSS: ${key}`);

    return {
      key,
      url: result.url,
      bucket: this.bucket,
      size: file.size,
    };
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (this.provider === 'local') {
      return this.localStorage!.getSignedUrl(key, expiresIn);
    }
    
    if (this.provider === 's3') {
      return this.getS3SignedUrl(key, expiresIn);
    } else if (this.provider === 'oss') {
      return this.getOSSSignedUrl(key, expiresIn);
    }

    throw new BadRequestException('Storage provider not configured');
  }

  private async getS3SignedUrl(key: string, expiresIn: number): Promise<string> {
    if (!this.s3Client) {
      throw new BadRequestException('S3 client not initialized');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  private async getOSSSignedUrl(key: string, expiresIn: number): Promise<string> {
    if (!this.ossClient) {
      throw new BadRequestException('OSS client not initialized');
    }

    return this.ossClient.signatureUrl(key, { expires: expiresIn });
  }

  async delete(key: string): Promise<void> {
    if (this.provider === 'local') {
      await this.localStorage!.delete(key);
      return;
    }
    
    if (this.provider === 's3') {
      await this.deleteFromS3(key);
    } else if (this.provider === 'oss') {
      await this.deleteFromOSS(key);
    } else {
      throw new BadRequestException('Storage provider not configured');
    }

    this.logger.log(`File deleted: ${key}`);
  }

  private async deleteFromS3(key: string): Promise<void> {
    if (!this.s3Client) {
      throw new BadRequestException('S3 client not initialized');
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  private async deleteFromOSS(key: string): Promise<void> {
    if (!this.ossClient) {
      throw new BadRequestException('OSS client not initialized');
    }

    await this.ossClient.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (this.provider === 'local') {
        return await this.localStorage!.exists(key);
      }
      
      if (this.provider === 's3') {
        return await this.existsInS3(key);
      } else if (this.provider === 'oss') {
        return await this.existsInOSS(key);
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private async existsInS3(key: string): Promise<boolean> {
    if (!this.s3Client) {
      return false;
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  private async existsInOSS(key: string): Promise<boolean> {
    if (!this.ossClient) {
      return false;
    }

    try {
      await this.ossClient.head(key);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    if (this.provider === 'local') {
      return this.localStorage!.getPublicUrl(key);
    }
    
    if (this.provider === 's3') {
      const region = this.configService.get('AWS_REGION');
      return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
    } else if (this.provider === 'oss') {
      const region = this.configService.get('OSS_REGION');
      return `https://${this.bucket}.${region}.aliyuncs.com/${key}`;
    }

    throw new BadRequestException('Storage provider not configured');
  }
}
