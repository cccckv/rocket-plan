import { ConfigService } from '@nestjs/config';
export declare class VideoStorageService {
    private configService;
    private readonly logger;
    private readonly uploadDir;
    constructor(configService: ConfigService);
    private ensureUploadDirectory;
    saveVideo(videoBuffer: Buffer, originalFilename?: string): Promise<string>;
    deleteVideo(localPath: string): Promise<void>;
    videoExists(localPath: string): Promise<boolean>;
    getVideoFullPath(localPath: string): string;
}
