import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUrl,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsArray,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';

export enum VideoType {
  TEXT_TO_VIDEO = 'text-to-video',
  IMAGE_TO_VIDEO = 'image-to-video',
  VIDEO_TO_VIDEO = 'video-to-video',
}

export enum VeoModel {
  VEO3_1_FAST_COMPONENTS = 'veo3.1-fast-components',
  VEO_3_1_FAST_COMPONENTS = 'veo_3_1-fast-components',
  VEO_3_1_FAST = 'veo_3_1-fast',
  VEO_3_1_FAST_4K = 'veo_3_1-fast-4K',
  VEO3_1_FAST = 'veo3.1-fast',
  VEO3_FAST = 'veo3-fast',
  VEO3_1 = 'veo3.1',
  VEO_3_1 = 'veo_3_1',
  VEO3_1_COMPONENTS = 'veo3.1-components',
  VEO_3_1_COMPONENTS = 'veo_3_1-components',
  VEO3 = 'veo3',
  VEO_3_1_4K = 'veo_3_1-4K',
  VEO_3_1_COMPONENTS_4K = 'veo_3_1-components-4K',
  VEO_3_1_FAST_COMPONENTS_4K = 'veo_3_1-fast-components-4K',
  VEO3_1_4K = 'veo3.1-4k',
  VEO3_1_COMPONENTS_4K = 'veo3.1-components-4k',
  VEO3_FAST_FRAMES = 'veo3-fast-frames',
  VEO3_FRAMES = 'veo3-frames',
  VEO3_PRO_FRAMES = 'veo3-pro-frames',
  VEO3_1_PRO = 'veo3.1-pro',
  VEO3_1_PRO_4K = 'veo3.1-pro-4k',
}

export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
}

export enum Resolution {
  HD_720P = '720P',
  FHD_1080P = '1080P',
}

export class CreateVideoTaskDto {
  @ApiProperty({
    description: '视频生成类型',
    enum: VideoType,
    example: VideoType.TEXT_TO_VIDEO,
  })
  @IsEnum(VideoType)
  type: VideoType;

  @ApiProperty({
    description: 'AI 模型',
    enum: VeoModel,
    example: VeoModel.VEO3_1_FAST,
  })
  @IsEnum(VeoModel)
  model: VeoModel;

  @ApiProperty({
    description: '视频描述提示词',
    example: 'A cat playing with a ball in a sunny garden',
  })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({
    description: '图片 URL（image-to-video 模式必填）',
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: '单张参考图片的 Base64 编码（替代 imageUrl）',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10_000_000)
  imageBase64?: string;

  @ApiPropertyOptional({
    description: '多张参考图片的 Base64 编码数组（最多3张，会合并为一张）',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  @MaxLength(10_000_000, { each: true })
  referenceImagesBase64?: string[];

  @ApiPropertyOptional({
    description: '首帧图片的 Base64 编码（帧插值模式）',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10_000_000)
  firstFrameBase64?: string;

  @ApiPropertyOptional({
    description: '尾帧图片的 Base64 编码（帧插值模式）',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10_000_000)
  lastFrameBase64?: string;

  @ApiPropertyOptional({
    description: '尾帧图片 URL（帧插值模式）',
    example: 'https://example.com/tail.jpg',
  })
  @IsOptional()
  @IsUrl()
  tailImageUrl?: string;

  @ApiPropertyOptional({
    description: '视频 URL（video-to-video 模式必填）',
    example: 'https://example.com/video.mp4',
  })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: '视频时长（秒）',
    example: 8,
    enum: [4, 5, 6, 7, 8],
  })
  @IsOptional()
  @IsInt()
  @Min(4)
  @Max(8)
  duration?: number;

  @ApiPropertyOptional({
    description: '视频宽高比',
    enum: AspectRatio,
    example: AspectRatio.LANDSCAPE,
  })
  @IsOptional()
  @IsEnum(AspectRatio)
  aspectRatio?: AspectRatio;

  @ApiPropertyOptional({
    description: '视频分辨率',
    enum: Resolution,
    example: Resolution.HD_720P,
  })
  @IsOptional()
  @IsEnum(Resolution)
  resolution?: Resolution;

  @ApiPropertyOptional({
    description: '负面提示词（避免的元素）',
    example: 'blurry, low quality, distorted',
  })
  @IsOptional()
  @IsString()
  negativePrompt?: string;

  @ApiPropertyOptional({
    description: '随机种子（相同种子生成相似结果）',
    example: 42,
  })
  @IsOptional()
  @IsInt()
  seed?: number;

  @ApiPropertyOptional({
    description: '是否增强提示词',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enhancePrompt?: boolean;

  @ApiPropertyOptional({
    description: '是否生成音频',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  generateAudio?: boolean;
}
