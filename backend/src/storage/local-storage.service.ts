import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadResult } from './storage.service';

@Injectable()
export class LocalStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    const port = this.configService.get<string>('PORT', '3000');
    this.baseUrl = `http://localhost:${port}/uploads`;
    
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`Created uploads directory: ${this.uploadDir}`);
    }
  }

  async upload(
    file: Express.Multer.File,
    folder: 'materials' | 'videos' | 'bgm' | 'templates',
  ): Promise<UploadResult> {
    const folderPath = path.join(this.uploadDir, folder);
    
    try {
      await fs.access(folderPath);
    } catch {
      await fs.mkdir(folderPath, { recursive: true });
    }

    const ext = file.originalname.split('.').pop();
    const filename = `${uuidv4()}.${ext}`;
    const key = `${folder}/${filename}`;
    const filePath = path.join(this.uploadDir, key);

    await fs.writeFile(filePath, file.buffer);

    const url = `${this.baseUrl}/${key}`;

    this.logger.log(`File uploaded locally: ${key}`);

    return {
      key,
      url,
      bucket: 'local',
      size: file.size,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    
    try {
      await fs.unlink(filePath);
      this.logger.log(`File deleted: ${key}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, key);
    
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    return this.getPublicUrl(key);
  }
}
