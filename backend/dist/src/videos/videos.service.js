"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var VideosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const aiapikey_service_1 = require("./services/aiapikey.service");
const video_storage_service_1 = require("./services/video-storage.service");
const image_util_service_1 = require("./services/image-util.service");
const credits_service_1 = require("../credits/credits.service");
const dto_1 = require("./dto");
let VideosService = VideosService_1 = class VideosService {
    prisma;
    aiApiService;
    storageService;
    imageUtilService;
    creditsService;
    logger = new common_1.Logger(VideosService_1.name);
    constructor(prisma, aiApiService, storageService, imageUtilService, creditsService) {
        this.prisma = prisma;
        this.aiApiService = aiApiService;
        this.storageService = storageService;
        this.imageUtilService = imageUtilService;
        this.creditsService = creditsService;
    }
    async createVideoTask(userId, dto) {
        this.validateTaskInput(dto);
        const creditCost = this.creditsService.getCreditCost(dto.model);
        const hasBalance = await this.creditsService.checkBalance(userId, creditCost);
        if (!hasBalance) {
            const balance = await this.creditsService.getBalance(userId);
            throw new common_1.BadRequestException(`Insufficient credits. Required: ${creditCost}, Available: ${balance.credits}`);
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
            const deductionResult = await this.creditsService.deductCredits(userId, creditCost, `Video generation: ${dto.model}`, task.id);
            this.logger.log(`Credits deducted for task ${task.id}. Amount: ${creditCost}, New balance: ${deductionResult.newBalance}`);
        }
        catch (error) {
            await this.prisma.videoTask.update({
                where: { id: task.id },
                data: { status: 'failed', errorMsg: 'Failed to deduct credits' },
            });
            throw error;
        }
        let tempFiles = [];
        try {
            const result = await this.processBase64Images(dto);
            tempFiles = result.tempFiles;
        }
        catch (error) {
            this.logger.error(`Failed to process base64 images for task ${task.id}:`, error);
            await this.prisma.videoTask.update({
                where: { id: task.id },
                data: { status: 'failed', errorMsg: `Image processing failed: ${error.message}` },
            });
            try {
                await this.creditsService.refundCredits(userId, creditCost, task.id, `Refund for image processing failure: ${error.message}`);
            }
            catch (refundError) {
                this.logger.error(`Failed to refund credits for task ${task.id}:`, refundError);
            }
            throw new common_1.BadRequestException(`Image processing failed: ${error.message}`);
        }
        this.initiateGeneration(task.id, dto, creditCost, tempFiles).catch((error) => {
            this.logger.error(`Failed to initiate generation for task ${task.id}:`, error);
        });
        return task;
    }
    async processBase64Images(dto) {
        const tempFiles = [];
        if (dto.referenceImagesBase64 && dto.referenceImagesBase64.length > 0) {
            const imagePaths = [];
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
    validateTaskInput(dto) {
        if (dto.type === dto_1.VideoType.IMAGE_TO_VIDEO) {
            const hasImage = dto.imageUrl ||
                dto.imageBase64 ||
                (dto.referenceImagesBase64 && dto.referenceImagesBase64.length > 0) ||
                dto.firstFrameBase64;
            if (!hasImage) {
                throw new common_1.BadRequestException('imageUrl, imageBase64, referenceImagesBase64, or firstFrameBase64 is required for image-to-video type');
            }
        }
        if (dto.type === dto_1.VideoType.VIDEO_TO_VIDEO && !dto.videoUrl) {
            throw new common_1.BadRequestException('videoUrl is required for video-to-video type');
        }
    }
    async initiateGeneration(taskId, dto, creditCost, tempFiles = []) {
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
        }
        catch (error) {
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
                    await this.creditsService.refundCredits(task.userId, creditCost, taskId, `Refund for failed video generation: ${error.message}`);
                    this.logger.log(`Refunded ${creditCost} credits to user ${task.userId} for failed task ${taskId}`);
                }
                catch (refundError) {
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
    async pollTaskStatus(taskId) {
        const task = await this.prisma.videoTask.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task ${taskId} not found`);
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
                const metadata = task.metadata ? JSON.parse(task.metadata) : {};
                const creditCost = metadata.creditCost || 0;
                if (creditCost > 0) {
                    try {
                        await this.creditsService.addCredits(task.userId, creditCost, 'refund', `Refund for failed video generation: ${status.error?.message || 'Unknown error'}`, taskId);
                        this.logger.log(`Refunded ${creditCost} credits to user ${task.userId} for failed task ${taskId}`);
                    }
                    catch (refundError) {
                        this.logger.error(`Failed to refund credits for task ${taskId}:`, refundError);
                    }
                }
            }
            if (wasAlreadyFailed) {
                return task;
            }
            return updatedTask;
        }
        catch (error) {
            this.logger.error(`Failed to poll status for task ${taskId}:`, error);
            throw error;
        }
    }
    async downloadAndSaveVideo(taskId, videoUrl) {
        try {
            this.logger.log(`Downloading video for task ${taskId} from ${videoUrl}`);
            const videoBuffer = await this.aiApiService.downloadVideo(videoUrl);
            const localPath = await this.storageService.saveVideo(videoBuffer);
            await this.prisma.videoTask.update({
                where: { id: taskId },
                data: { localPath },
            });
            this.logger.log(`Video downloaded and saved for task ${taskId} at ${localPath}`);
        }
        catch (error) {
            this.logger.error(`Failed to download/save video for task ${taskId}:`, error);
        }
    }
    async getTaskById(taskId, userId) {
        const task = await this.prisma.videoTask.findFirst({
            where: {
                id: taskId,
                userId,
            },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task ${taskId} not found or access denied`);
        }
        return task;
    }
    async getUserTasks(userId, limit = 20, offset = 0) {
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
    async deleteTask(taskId, userId) {
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
};
exports.VideosService = VideosService;
exports.VideosService = VideosService = VideosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        aiapikey_service_1.AIApiKeyService,
        video_storage_service_1.VideoStorageService,
        image_util_service_1.ImageUtilService,
        credits_service_1.CreditsService])
], VideosService);
//# sourceMappingURL=videos.service.js.map