import { ConfigService } from '@nestjs/config';
import { UploadResult } from './storage.service';
export declare class LocalStorageService {
    private configService;
    private readonly logger;
    private readonly uploadDir;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    private ensureUploadDir;
    upload(file: Express.Multer.File, folder: 'materials' | 'videos' | 'bgm' | 'templates'): Promise<UploadResult>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    getPublicUrl(key: string): string;
    getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}
