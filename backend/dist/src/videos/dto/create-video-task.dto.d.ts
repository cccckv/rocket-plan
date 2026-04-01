export declare enum VideoType {
    TEXT_TO_VIDEO = "text-to-video",
    IMAGE_TO_VIDEO = "image-to-video",
    VIDEO_TO_VIDEO = "video-to-video"
}
export declare enum VeoModel {
    VEO3_1_FAST = "veo3.1-fast",
    VEO3_FAST = "veo3-fast",
    VEO3_1 = "veo3.1",
    VEO3_1_COMPONENTS = "veo3.1-components",
    VEO3 = "veo3"
}
export declare enum AspectRatio {
    LANDSCAPE = "16:9",
    PORTRAIT = "9:16"
}
export declare enum Resolution {
    HD_720P = "720P",
    FHD_1080P = "1080P"
}
export declare class CreateVideoTaskDto {
    type: VideoType;
    model: VeoModel;
    prompt: string;
    imageUrl?: string;
    imageBase64?: string;
    referenceImagesBase64?: string[];
    firstFrameBase64?: string;
    lastFrameBase64?: string;
    tailImageUrl?: string;
    videoUrl?: string;
    duration?: number;
    aspectRatio?: AspectRatio;
    resolution?: Resolution;
    negativePrompt?: string;
    seed?: number;
    enhancePrompt?: boolean;
    generateAudio?: boolean;
}
