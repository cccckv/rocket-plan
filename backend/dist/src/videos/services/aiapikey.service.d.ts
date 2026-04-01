import { ConfigService } from '@nestjs/config';
export interface VideoGenerationRequest {
    model: string;
    prompt: string;
    imageUrl?: string;
    tailImageUrl?: string;
    duration?: number;
    aspectRatio?: string;
    resolution?: string;
    negativePrompt?: string;
    seed?: number;
    enhancePrompt?: boolean;
    generateAudio?: boolean;
}
export interface VideoGenerationResponse {
    id: string;
    object: string;
    model: string;
    status: 'queued' | 'generating' | 'completed' | 'failed';
    progress: number;
    created_at: number;
    completed_at?: number;
    url?: string;
    video_url?: string;
    result_url?: string;
    size?: string;
    seconds?: string;
    detail?: any;
    error?: {
        name: string;
        message: string;
    };
}
export declare class AIApiKeyService {
    private configService;
    private readonly logger;
    private readonly client;
    private readonly baseUrl;
    private readonly apiKey;
    constructor(configService: ConfigService);
    createVideoTask(request: VideoGenerationRequest): Promise<{
        id: string;
        status: string;
    }>;
    getVideoStatus(generationId: string): Promise<VideoGenerationResponse>;
    pollUntilComplete(generationId: string, timeoutMs?: number, intervalMs?: number): Promise<VideoGenerationResponse>;
    downloadVideo(videoUrl: string): Promise<Buffer>;
}
