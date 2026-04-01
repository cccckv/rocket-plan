export declare class VideoTaskResponseDto {
    id: string;
    userId: number;
    type: string;
    model: string;
    prompt: string;
    imageUrl?: string;
    videoUrl?: string;
    status: string;
    resultUrl?: string;
    localPath?: string;
    thumbnailUrl?: string;
    duration?: number;
    metadata?: any;
    errorMsg?: string;
    createdAt: Date;
    updatedAt: Date;
}
