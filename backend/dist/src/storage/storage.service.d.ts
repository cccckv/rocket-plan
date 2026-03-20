import { ConfigService } from '@nestjs/config';
export interface UploadResult {
    key: string;
    url: string;
    bucket: string;
    size: number;
}
export declare class StorageService {
    private configService;
    private readonly logger;
    private readonly provider;
    private s3Client?;
    private ossClient?;
    private localStorage?;
    private bucket;
    constructor(configService: ConfigService);
    private initLocal;
    private initS3;
    private initOSS;
    upload(file: Express.Multer.File, folder: 'materials' | 'videos' | 'bgm' | 'templates'): Promise<UploadResult>;
    private uploadToS3;
    private uploadToOSS;
    getSignedUrl(key: string, expiresIn?: number): Promise<string>;
    private getS3SignedUrl;
    private getOSSSignedUrl;
    delete(key: string): Promise<void>;
    private deleteFromS3;
    private deleteFromOSS;
    exists(key: string): Promise<boolean>;
    private existsInS3;
    private existsInOSS;
    getPublicUrl(key: string): string;
}
