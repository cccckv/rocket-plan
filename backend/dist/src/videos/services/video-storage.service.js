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
var VideoStorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoStorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
let VideoStorageService = VideoStorageService_1 = class VideoStorageService {
    configService;
    logger = new common_1.Logger(VideoStorageService_1.name);
    uploadDir;
    constructor(configService) {
        this.configService = configService;
        this.uploadDir = path.join(process.cwd(), 'uploads', 'ai-videos');
        this.ensureUploadDirectory();
    }
    async ensureUploadDirectory() {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
            this.logger.log(`Upload directory ensured: ${this.uploadDir}`);
        }
        catch (error) {
            this.logger.error('Failed to create upload directory:', error);
        }
    }
    async saveVideo(videoBuffer, originalFilename) {
        const filename = `${(0, uuid_1.v4)()}.mp4`;
        const filePath = path.join(this.uploadDir, filename);
        try {
            await fs.writeFile(filePath, videoBuffer);
            this.logger.log(`Video saved to: ${filePath}`);
            return `/uploads/ai-videos/${filename}`;
        }
        catch (error) {
            this.logger.error('Failed to save video:', error);
            throw new Error(`Failed to save video: ${error.message}`);
        }
    }
    async deleteVideo(localPath) {
        try {
            const fullPath = path.join(process.cwd(), localPath);
            await fs.unlink(fullPath);
            this.logger.log(`Video deleted: ${fullPath}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete video ${localPath}:`, error);
        }
    }
    async videoExists(localPath) {
        try {
            const fullPath = path.join(process.cwd(), localPath);
            await fs.access(fullPath);
            return true;
        }
        catch {
            return false;
        }
    }
    getVideoFullPath(localPath) {
        return path.join(process.cwd(), localPath);
    }
};
exports.VideoStorageService = VideoStorageService;
exports.VideoStorageService = VideoStorageService = VideoStorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], VideoStorageService);
//# sourceMappingURL=video-storage.service.js.map