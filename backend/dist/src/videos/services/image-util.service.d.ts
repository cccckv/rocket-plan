export declare class ImageUtilService {
    private readonly logger;
    onModuleInit(): Promise<void>;
    base64ToBuffer(base64: string): Buffer;
    private detectFormat;
    saveTemporaryImage(buffer: Buffer, format?: string): Promise<string>;
    mergeImages(imagePaths: string[], maxWidth?: number): Promise<string>;
    cleanupTemporaryFiles(filePaths: string[]): Promise<void>;
}
