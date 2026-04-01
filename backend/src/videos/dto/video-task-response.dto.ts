import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VideoTaskResponseDto {
  @ApiProperty({ description: '任务 ID', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: '用户 ID', example: 1 })
  userId: number;

  @ApiProperty({
    description: '任务类型',
    example: 'text-to-video',
  })
  type: string;

  @ApiProperty({ description: 'AI 模型', example: 'google/veo-3.0-fast' })
  model: string;

  @ApiProperty({
    description: '提示词',
    example: 'A cat playing in a garden',
  })
  prompt: string;

  @ApiPropertyOptional({
    description: '图片 URL',
    example: 'https://example.com/image.jpg',
  })
  imageUrl?: string;

  @ApiPropertyOptional({
    description: '视频 URL',
    example: 'https://example.com/video.mp4',
  })
  videoUrl?: string;

  @ApiProperty({
    description: '任务状态',
    example: 'generating',
    enum: ['pending', 'queued', 'generating', 'completed', 'failed'],
  })
  status: string;

  @ApiPropertyOptional({
    description: '生成的视频 URL',
    example: 'https://cdn.example.com/generated-video.mp4',
  })
  resultUrl?: string;

  @ApiPropertyOptional({
    description: '本地存储路径',
    example: '/uploads/videos/uuid.mp4',
  })
  localPath?: string;

  @ApiPropertyOptional({
    description: '缩略图 URL',
    example: 'https://cdn.example.com/thumbnail.jpg',
  })
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: '视频时长（秒）', example: 8 })
  duration?: number;

  @ApiPropertyOptional({
    description: '元数据（JSON）',
    example: { resolution: '720P', aspectRatio: '16:9' },
  })
  metadata?: any;

  @ApiPropertyOptional({
    description: '错误信息',
    example: 'Generation failed: timeout',
  })
  errorMsg?: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}
