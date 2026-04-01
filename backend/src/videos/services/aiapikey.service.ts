import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

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

@Injectable()
export class AIApiKeyService {
  private readonly logger = new Logger(AIApiKeyService.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('AIAPIKEY_BASE_URL') ||
      'https://api.aimlapi.com';
    this.apiKey = this.configService.get<string>('AIAPIKEY_API_KEY') || '';

    if (!this.apiKey) {
      this.logger.warn('AIAPIKEY_API_KEY not configured');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      timeout: 30000, // 30 seconds for API calls
    });
  }

  /**
   * 创建视频生成任务（异步）
   */
  async createVideoTask(
    request: VideoGenerationRequest,
  ): Promise<{ id: string; status: string }> {
    try {
      this.logger.log(
        `Creating video task with model: ${request.model}, prompt: ${request.prompt.substring(0, 50)}...`,
      );

      const form = new FormData();
      form.append('model', request.model);
      form.append('prompt', request.prompt);

      if (request.imageUrl) {
        if (request.imageUrl.startsWith('/')) {
          form.append('image', fs.createReadStream(request.imageUrl), {
            filename: path.basename(request.imageUrl),
            contentType: 'image/png',
          });
        } else {
          form.append('image_url', request.imageUrl);
        }
      }
      if (request.tailImageUrl) {
        if (request.tailImageUrl.startsWith('/')) {
          form.append('tail_image', fs.createReadStream(request.tailImageUrl), {
            filename: path.basename(request.tailImageUrl),
            contentType: 'image/png',
          });
        } else {
          form.append('tail_image_url', request.tailImageUrl);
        }
      }
      if (request.duration) {
        form.append('duration', request.duration.toString());
      }
      if (request.aspectRatio) {
        form.append('aspect_ratio', request.aspectRatio);
      }
      if (request.resolution) {
        form.append('resolution', request.resolution);
      }
      if (request.negativePrompt) {
        form.append('negative_prompt', request.negativePrompt);
      }
      if (request.seed !== undefined) {
        form.append('seed', request.seed.toString());
      }
      if (request.enhancePrompt !== undefined) {
        form.append('enhance_prompt', request.enhancePrompt.toString());
      }
      if (request.generateAudio !== undefined) {
        form.append('generate_audio', request.generateAudio.toString());
      }

      const response = await axios.post<VideoGenerationResponse>(
        `${this.baseUrl}/v1/videos`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        },
      );

      this.logger.log(
        `Video task created: ${response.data.id}, status: ${response.data.status}`,
      );

      return {
        id: response.data.id,
        status: response.data.status,
      };
    } catch (error) {
      this.logger.error('Failed to create video task:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg =
          error.response?.data?.message ||
          error.response?.data?.code ||
          error.message;
        throw new Error(`AI API Error: ${errorMsg}`);
      }
      throw error;
    }
  }

  /**
   * 查询视频生成状态
   */
  async getVideoStatus(generationId: string): Promise<VideoGenerationResponse> {
    try {
      const response = await axios.get<VideoGenerationResponse>(
        `${this.baseUrl}/v1/videos/${generationId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        },
      );

      this.logger.debug(
        `Video status for ${generationId}: ${response.data.status}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get video status for ${generationId}:`,
        error,
      );
      if (axios.isAxiosError(error)) {
        const errorMsg =
          error.response?.data?.message ||
          error.response?.data?.code ||
          error.message;
        throw new Error(`AI API Error: ${errorMsg}`);
      }
      throw error;
    }
  }

  /**
   * 轮询直到视频生成完成（带超时）
   */
  async pollUntilComplete(
    generationId: string,
    timeoutMs: number = 600000, // 10 minutes
    intervalMs: number = 5000, // 5 seconds
  ): Promise<VideoGenerationResponse> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getVideoStatus(generationId);

      if (status.status === 'completed') {
        this.logger.log(`Video generation completed: ${generationId}`);
        return status;
      }

      if (status.status === 'failed') {
        this.logger.error(
          `Video generation failed: ${generationId}, error: ${status.error?.message}`,
        );
        throw new Error(
          status.error?.message || 'Video generation failed with unknown error',
        );
      }

      // Still generating or queued
      this.logger.debug(
        `Video ${generationId} status: ${status.status}, waiting ${intervalMs}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error(
      `Timeout waiting for video generation: ${generationId} (${timeoutMs}ms)`,
    );
  }

  /**
   * 下载生成的视频文件
   */
  async downloadVideo(videoUrl: string): Promise<Buffer> {
    try {
      this.logger.log(`Downloading video from: ${videoUrl}`);

      const response = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 120000, // 2 minutes for download
      });

      this.logger.log(
        `Video downloaded successfully, size: ${response.data.length} bytes`,
      );

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(`Failed to download video from ${videoUrl}:`, error);
      throw new Error(`Failed to download video: ${error.message}`);
    }
  }
}
