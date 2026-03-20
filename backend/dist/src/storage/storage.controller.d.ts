import { StorageService } from './storage.service';
export declare class StorageController {
    private storageService;
    constructor(storageService: StorageService);
    uploadFile(file: Express.Multer.File, folder: string): Promise<{
        key: string;
        url: string;
        bucket: string;
        size: number;
        message: string;
    }>;
    getSignedUrl(key: string, expiresIn?: string): Promise<{
        url: string;
        expiresIn: number;
    }>;
    deleteFile(key: string): Promise<{
        message: string;
        key: string;
    }>;
    checkExists(key: string): Promise<{
        exists: boolean;
        key: string;
    }>;
    getPublicUrl(key: string): Promise<{
        url: string;
        key: string;
    }>;
}
