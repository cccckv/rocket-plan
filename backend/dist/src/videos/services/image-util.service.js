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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ImageUtilService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageUtilService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const sharp_1 = __importDefault(require("sharp"));
const TEMP_DIR = path.join('/tmp', 'rocket-plan-images');
let ImageUtilService = ImageUtilService_1 = class ImageUtilService {
    logger = new common_1.Logger(ImageUtilService_1.name);
    async onModuleInit() {
        await fs.mkdir(TEMP_DIR, { recursive: true });
    }
    base64ToBuffer(base64) {
        const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
        return Buffer.from(base64Data, 'base64');
    }
    detectFormat(buffer) {
        if (buffer[0] === 0xff && buffer[1] === 0xd8)
            return 'jpg';
        if (buffer[0] === 0x89 && buffer[1] === 0x50)
            return 'png';
        if (buffer[0] === 0x52 && buffer[1] === 0x49)
            return 'webp';
        return 'png';
    }
    async saveTemporaryImage(buffer, format) {
        const ext = format || this.detectFormat(buffer);
        const filename = `${(0, uuid_1.v4)()}.${ext}`;
        const filePath = path.join(TEMP_DIR, filename);
        await fs.writeFile(filePath, buffer);
        this.logger.debug(`Saved temporary image: ${filePath} (${buffer.length} bytes)`);
        return filePath;
    }
    async mergeImages(imagePaths, maxWidth = 2048) {
        const images = await Promise.all(imagePaths.map(async (p) => {
            const img = (0, sharp_1.default)(p);
            const metadata = await img.metadata();
            return { path: p, width: metadata.width || 0, height: metadata.height || 0 };
        }));
        const maxHeight = Math.max(...images.map((i) => i.height));
        const perImageWidth = Math.floor(maxWidth / images.length);
        const resizedBuffers = await Promise.all(images.map(async (img) => {
            const resized = await (0, sharp_1.default)(img.path)
                .resize({
                width: perImageWidth,
                height: maxHeight,
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
                .png()
                .toBuffer();
            return { buffer: resized, width: perImageWidth, height: maxHeight };
        }));
        const compositeInputs = resizedBuffers.map((item, index) => ({
            input: item.buffer,
            left: index * perImageWidth,
            top: 0,
        }));
        const totalWidth = perImageWidth * images.length;
        const mergedPath = path.join(TEMP_DIR, `${(0, uuid_1.v4)()}-merged.png`);
        await (0, sharp_1.default)({
            create: {
                width: totalWidth,
                height: maxHeight,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
        })
            .composite(compositeInputs)
            .png()
            .toFile(mergedPath);
        this.logger.debug(`Merged ${images.length} images into: ${mergedPath} (${totalWidth}x${maxHeight})`);
        return mergedPath;
    }
    async cleanupTemporaryFiles(filePaths) {
        for (const filePath of filePaths) {
            try {
                await fs.unlink(filePath);
                this.logger.debug(`Cleaned up temp file: ${filePath}`);
            }
            catch (error) {
                this.logger.warn(`Failed to cleanup temp file ${filePath}: ${error.message}`);
            }
        }
    }
};
exports.ImageUtilService = ImageUtilService;
exports.ImageUtilService = ImageUtilService = ImageUtilService_1 = __decorate([
    (0, common_1.Injectable)()
], ImageUtilService);
//# sourceMappingURL=image-util.service.js.map