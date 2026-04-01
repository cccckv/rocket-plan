import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIApiKeyService } from './services/aiapikey.service';
import { VideoStorageService } from './services/video-storage.service';
import { ImageUtilService } from './services/image-util.service';
import { CreditsService } from '../credits/credits.service';
import { CreateVideoTaskDto, VideoType } from './dto';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    private prisma: PrismaService,
    private aiApiService: AIApiKeyService,
    private storageService: VideoStorageService,
    private imageUtilService: ImageUtilService,
    private creditsService: CreditsService,
  ) {}

  async createVideoTask(userId: number, dto: CreateVideoTaskDto) {
    this.validateTaskInput(dto);

    const creditCost = this.creditsService.getCreditCost(dto.model);

    const hasBalance = await this.creditsService.checkBalance(userId, creditCost);
    if (!hasBalance) {
      const balance = await this.creditsService.getBalance(userId);
      throw new BadRequestException(
        `Insufficient credits. Required: ${creditCost}, Available: ${balance.credits}`,
      );
    }

    const metadata = {
      duration: dto.duration,
      aspectRatio: dto.aspectRatio,
      resolution: dto.resolution,
      seed: dto.seed,
      enhancePrompt: dto.enhancePrompt,
      generateAudio: dto.generateAudio,
      creditCost,
    };

    const task = await this.prisma.videoTask.create({
      data: {
        userId,
        type: dto.type,
        model: dto.model,
        prompt: dto.prompt,
        imageUrl: dto.imageUrl,
        videoUrl: dto.videoUrl,
        status: 'pending',
        metadata: JSON.stringify(metadata),
      },
    });

    this.logger.log(`Video task created: ${task.id} for user ${userId}, cost: ${creditCost} credits`);

    try {
      const deductionResult = await this.creditsService.deductCredits(
        userId,
        creditCost,
        `Video generation: ${dto.model}`,
        task.id,
      );

      this.logger.log(
        `Credits deducted for task ${task.id}. Amount: ${creditCost}, New balance: ${deductionResult.newBalance}`,
      );
    } catch (error) {
      await this.prisma.videoTask.update({
        where: { id: task.id },
        data: { status: 'failed', errorMsg: 'Failed to deduct credits' },
      });
      throw error;
    }

    let tempFiles: string[] = [];
    try {
      const result = await this.processBase64Images(dto);
      tempFiles = result.tempFiles;
    } catch (error) {
      this.logger.error(`Failed to process base64 images for task ${task.id}:`, error);
      await this.prisma.videoTask.update({
        where: { id: task.id },
        data: { status: 'failed', errorMsg: `Image processing failed: ${error.message}` },
      });
      try {
        await this.creditsService.refundCredits(
          userId,
          creditCost,
          task.id,
          `Refund for image processing failure: ${error.message}`,
        );
      } catch (refundError) {
        this.logger.error(`Failed to refund credits for task ${task.id}:`, refundError);
      }
      throw new BadRequestException(`Image processing failed: ${error.message}`);
    }

    this.initiateGeneration(task.id, dto, creditCost, tempFiles).catch((error) => {
      this.logger.error(`Failed to initiate generation for task ${task.id}:`, error);
    });

    return task;
  }

  private async processBase64Images(dto: CreateVideoTaskDto): Promise<{ tempFiles: string[] }> {
    const tempFiles: string[] = [];

    if (dto.referenceImagesBase64 && dto.referenceImagesBase64.length > 0) {
      const imagePaths: string[] = [];
      for (const b64 of dto.referenceImagesBase64) {
        const buffer = this.imageUtilService.base64ToBuffer(b64);
        const filePath = await this.imageUtilService.saveTemporaryImage(buffer);
        imagePaths.push(filePath);
        tempFiles.push(filePath);
      }
      const mergedPath = await this.imageUtilService.mergeImages(imagePaths);
      tempFiles.push(mergedPath);
      dto.imageUrl = mergedPath;
      return { tempFiles };
    }

    if (dto.imageBase64) {
      const buffer = this.imageUtilService.base64ToBuffer(dto.imageBase64);
      const filePath = await this.imageUtilService.saveTemporaryImage(buffer);
      tempFiles.push(filePath);
      dto.imageUrl = filePath;
      return { tempFiles };
    }

    if (dto.firstFrameBase64 && dto.lastFrameBase64) {
      const firstBuffer = this.imageUtilService.base64ToBuffer(dto.firstFrameBase64);
      const firstPath = await this.imageUtilService.saveTemporaryImage(firstBuffer);
      tempFiles.push(firstPath);

      const lastBuffer = this.imageUtilService.base64ToBuffer(dto.lastFrameBase64);
      const lastPath = await this.imageUtilService.saveTemporaryImage(lastBuffer);
      tempFiles.push(lastPath);

      dto.imageUrl = firstPath;
      dto.tailImageUrl = lastPath;
      return { tempFiles };
    }

    return { tempFiles };
  }

  private validateTaskInput(dto: CreateVideoTaskDto) {
    if (dto.type === VideoType.IMAGE_TO_VIDEO) {
      const hasImage =
        dto.imageUrl ||
        dto.imageBase64 ||
        (dto.referenceImagesBase64 && dto.referenceImagesBase64.length > 0) ||
        dto.firstFrameBase64;
      if (!hasImage) {
        throw new BadRequestException(
          'imageUrl, imageBase64, referenceImagesBase64, or firstFrameBase64 is required for image-to-video type',
        );
      }
    }
    if (dto.type === VideoType.VIDEO_TO_VIDEO && !dto.videoUrl) {
      throw new BadRequestException('videoUrl is required for video-to-video type');
    }
  }

  private async initiateGeneration(taskId: string, dto: CreateVideoTaskDto, creditCost: number, tempFiles: string[] = []) {
    try {
      await this.prisma.videoTask.update({
        where: { id: taskId },
        data: { status: 'queued' },
      });

      const response = await this.aiApiService.createVideoTask({
        model: dto.model,
        prompt: dto.prompt,
        imageUrl: dto.imageUrl,
        tailImageUrl: dto.tailImageUrl,
        duration: dto.duration,
        aspectRatio: dto.aspectRatio,
        resolution: dto.resolution,
        negativePrompt: dto.negativePrompt,
        seed: dto.seed,
        enhancePrompt: dto.enhancePrompt,
        generateAudio: dto.generateAudio,
      });

      await this.prisma.videoTask.update({
        where: { id: taskId },
        data: {
          generationId: response.id,
          status: response.status,
        },
      });

      this.logger.log(`AI generation started for task ${taskId}, generation ID: ${response.id}`);

      if (tempFiles.length > 0) {
        setTimeout(() => {
          this.imageUtilService.cleanupTemporaryFiles(tempFiles).catch((err) => {
            this.logger.warn(`Temp file cleanup failed for task ${taskId}: ${err.message}`);
          });
        }, 30000);
      }
    } catch (error) {
      this.logger.error(`Failed to initiate AI generation for task ${taskId}:`, error);

      if (tempFiles.length > 0) {
        this.imageUtilService.cleanupTemporaryFiles(tempFiles).catch((err) => {
          this.logger.warn(`Temp file cleanup failed for task ${taskId}: ${err.message}`);
        });
      }
      
      const task = await this.prisma.videoTask.findUnique({
        where: { id: taskId },
        select: { userId: true },
      });

      if (task) {
        try {
          await this.creditsService.refundCredits(
            task.userId,
            creditCost,
            taskId,
            `Refund for failed video generation: ${error.message}`,
          );
          this.logger.log(`Refunded ${creditCost} credits to user ${task.userId} for failed task ${taskId}`);
        } catch (refundError) {
          this.logger.error(`Failed to refund credits for task ${taskId}:`, refundError);
        }
      }

      await this.prisma.videoTask.update({
        where: { id: taskId },
        data: {
          status: 'failed',
          errorMsg: error.message,
        },
      });
    }
  }

  async pollTaskStatus(taskId: string) {
    const task = await this.prisma.videoTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    if (!task.generationId) {
      return task;
    }

    if (task.status === 'completed') {
      return task;
    }
    
    const wasAlreadyFailed = task.status === 'failed';

    try {
      const status = await this.aiApiService.getVideoStatus(task.generationId);

      const videoUrl = status.url || status.video_url || status.result_url;

      const updatedTask = await this.prisma.videoTask.update({
        where: { id: taskId },
        data: {
          status: status.status,
          resultUrl: videoUrl,
          duration: status.seconds ? parseInt(status.seconds) : task.duration,
          errorMsg: status.error?.message,
        },
      });

      if (status.status === 'completed' && videoUrl) {
        this.downloadAndSaveVideo(taskId, videoUrl).catch((error) => {
          this.logger.error(`Failed to download video for task ${taskId}:`, error);
        });
      }

      if (status.status === 'failed' && !wasAlreadyFailed) {
        const metadata = task.metadata ? JSON.parse(task.metadata as string) : {};
        const creditCost = metadata.creditCost || 0;
        
        if (creditCost > 0) {
          try {
            await this.creditsService.addCredits(
              task.userId,
              creditCost,
              'refund',
              `Refund for failed video generation: ${status.error?.message || 'Unknown error'}`,
              taskId,
            );
            this.logger.log(`Refunded ${creditCost} credits to user ${task.userId} for failed task ${taskId}`);
          } catch (refundError) {
            this.logger.error(`Failed to refund credits for task ${taskId}:`, refundError);
          }
        }
      }
      
      if (wasAlreadyFailed) {
        return task;
      }

      return updatedTask;
    } catch (error) {
      this.logger.error(`Failed to poll status for task ${taskId}:`, error);
      throw error;
    }
  }

  private async downloadAndSaveVideo(taskId: string, videoUrl: string) {
    try {
      this.logger.log(`Downloading video for task ${taskId} from ${videoUrl}`);

      const videoBuffer = await this.aiApiService.downloadVideo(videoUrl);
      const localPath = await this.storageService.saveVideo(videoBuffer);

      await this.prisma.videoTask.update({
        where: { id: taskId },
        data: { localPath },
      });

      this.logger.log(`Video downloaded and saved for task ${taskId} at ${localPath}`);
    } catch (error) {
      this.logger.error(`Failed to download/save video for task ${taskId}:`, error);
    }
  }

  async getTaskById(taskId: string, userId: number) {
    const task = await this.prisma.videoTask.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found or access denied`);
    }

    return task;
  }

  async getUserTasks(userId: number, limit: number = 20, offset: number = 0) {
    const [tasks, total] = await Promise.all([
      this.prisma.videoTask.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.videoTask.count({
        where: { userId },
      }),
    ]);

    return {
      tasks,
      total,
      limit,
      offset,
    };
  }

  async deleteTask(taskId: string, userId: number) {
    const task = await this.getTaskById(taskId, userId);

    if (task.localPath) {
      await this.storageService.deleteVideo(task.localPath);
    }

    await this.prisma.videoTask.delete({
      where: { id: taskId },
    });

    this.logger.log(`Task ${taskId} deleted by user ${userId}`);

    return { success: true };
  }
}
