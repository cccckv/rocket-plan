"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AIApiKeyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIApiKeyService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let AIApiKeyService = AIApiKeyService_1 = class AIApiKeyService {
    configService;
    logger = new common_1.Logger(AIApiKeyService_1.name);
    client;
    baseUrl;
    apiKey;
    constructor(configService) {
        this.configService = configService;
        this.baseUrl =
            this.configService.get('AIAPIKEY_BASE_URL') ||
                'https://api.aimlapi.com';
        this.apiKey = this.configService.get('AIAPIKEY_API_KEY') || '';
        if (!this.apiKey) {
            this.logger.warn('AIAPIKEY_API_KEY not configured');
        }
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            timeout: 30000,
        });
    }
    async createVideoTask(request) {
        try {
            this.logger.log(`Creating video task with model: ${request.model}, prompt: ${request.prompt.substring(0, 50)}...`);
            const form = new form_data_1.default();
            form.append('model', request.model);
            form.append('prompt', request.prompt);
            if (request.imageUrl) {
                if (request.imageUrl.startsWith('/')) {
                    form.append('image', fs.createReadStream(request.imageUrl), {
                        filename: path.basename(request.imageUrl),
                        contentType: 'image/png',
                    });
                }
                else {
                    form.append('image_url', request.imageUrl);
                }
            }
            if (request.tailImageUrl) {
                if (request.tailImageUrl.startsWith('/')) {
                    form.append('tail_image', fs.createReadStream(request.tailImageUrl), {
                        filename: path.basename(request.tailImageUrl),
                        contentType: 'image/png',
                    });
                }
                else {
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
            const response = await axios_1.default.post(`${this.baseUrl}/v1/videos`, form, {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${this.apiKey}`,
                },
                timeout: 30000,
            });
            this.logger.log(`Video task created: ${response.data.id}, status: ${response.data.status}`);
            return {
                id: response.data.id,
                status: response.data.status,
            };
        }
        catch (error) {
            this.logger.error('Failed to create video task:', error);
            if (axios_1.default.isAxiosError(error)) {
                const errorMsg = error.response?.data?.message ||
                    error.response?.data?.code ||
                    error.message;
                throw new Error(`AI API Error: ${errorMsg}`);
            }
            throw error;
        }
    }
    async getVideoStatus(generationId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/v1/videos/${generationId}`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
                timeout: 30000,
            });
            this.logger.debug(`Video status for ${generationId}: ${response.data.status}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to get video status for ${generationId}:`, error);
            if (axios_1.default.isAxiosError(error)) {
                const errorMsg = error.response?.data?.message ||
                    error.response?.data?.code ||
                    error.message;
                throw new Error(`AI API Error: ${errorMsg}`);
            }
            throw error;
        }
    }
    async pollUntilComplete(generationId, timeoutMs = 600000, intervalMs = 5000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            const status = await this.getVideoStatus(generationId);
            if (status.status === 'completed') {
                this.logger.log(`Video generation completed: ${generationId}`);
                return status;
            }
            if (status.status === 'failed') {
                this.logger.error(`Video generation failed: ${generationId}, error: ${status.error?.message}`);
                throw new Error(status.error?.message || 'Video generation failed with unknown error');
            }
            this.logger.debug(`Video ${generationId} status: ${status.status}, waiting ${intervalMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
        throw new Error(`Timeout waiting for video generation: ${generationId} (${timeoutMs}ms)`);
    }
    async downloadVideo(videoUrl) {
        try {
            this.logger.log(`Downloading video from: ${videoUrl}`);
            const response = await axios_1.default.get(videoUrl, {
                responseType: 'arraybuffer',
                timeout: 120000,
            });
            this.logger.log(`Video downloaded successfully, size: ${response.data.length} bytes`);
            return Buffer.from(response.data);
        }
        catch (error) {
            this.logger.error(`Failed to download video from ${videoUrl}:`, error);
            throw new Error(`Failed to download video: ${error.message}`);
        }
    }
};
exports.AIApiKeyService = AIApiKeyService;
exports.AIApiKeyService = AIApiKeyService = AIApiKeyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AIApiKeyService);
//# sourceMappingURL=aiapikey.service.js.map