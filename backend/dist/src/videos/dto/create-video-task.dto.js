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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateVideoTaskDto = exports.Resolution = exports.AspectRatio = exports.VeoModel = exports.VideoType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var VideoType;
(function (VideoType) {
    VideoType["TEXT_TO_VIDEO"] = "text-to-video";
    VideoType["IMAGE_TO_VIDEO"] = "image-to-video";
    VideoType["VIDEO_TO_VIDEO"] = "video-to-video";
})(VideoType || (exports.VideoType = VideoType = {}));
var VeoModel;
(function (VeoModel) {
    VeoModel["VEO3_1_FAST"] = "veo3.1-fast";
    VeoModel["VEO3_FAST"] = "veo3-fast";
    VeoModel["VEO3_1"] = "veo3.1";
    VeoModel["VEO3_1_COMPONENTS"] = "veo3.1-components";
    VeoModel["VEO3"] = "veo3";
})(VeoModel || (exports.VeoModel = VeoModel = {}));
var AspectRatio;
(function (AspectRatio) {
    AspectRatio["LANDSCAPE"] = "16:9";
    AspectRatio["PORTRAIT"] = "9:16";
})(AspectRatio || (exports.AspectRatio = AspectRatio = {}));
var Resolution;
(function (Resolution) {
    Resolution["HD_720P"] = "720P";
    Resolution["FHD_1080P"] = "1080P";
})(Resolution || (exports.Resolution = Resolution = {}));
class CreateVideoTaskDto {
    type;
    model;
    prompt;
    imageUrl;
    imageBase64;
    referenceImagesBase64;
    firstFrameBase64;
    lastFrameBase64;
    tailImageUrl;
    videoUrl;
    duration;
    aspectRatio;
    resolution;
    negativePrompt;
    seed;
    enhancePrompt;
    generateAudio;
}
exports.CreateVideoTaskDto = CreateVideoTaskDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '视频生成类型',
        enum: VideoType,
        example: VideoType.TEXT_TO_VIDEO,
    }),
    (0, class_validator_1.IsEnum)(VideoType),
    __metadata("design:type", String)
], CreateVideoTaskDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'AI 模型',
        enum: VeoModel,
        example: VeoModel.VEO3_1_FAST,
    }),
    (0, class_validator_1.IsEnum)(VeoModel),
    __metadata("design:type", String)
], CreateVideoTaskDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '视频描述提示词',
        example: 'A cat playing with a ball in a sunny garden',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVideoTaskDto.prototype, "prompt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '图片 URL（image-to-video 模式必填）',
        example: 'https://example.com/image.jpg',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateVideoTaskDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '单张参考图片的 Base64 编码（替代 imageUrl）',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10_000_000),
    __metadata("design:type", String)
], CreateVideoTaskDto.prototype, "imageBase64", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '多张参考图片的 Base64 编码数组（最多3张，会合并为一张）',
        type: [String],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(3),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(10_000_000, { each: true }),
    __metadata("design:type", Array)
], CreateVideoTaskDto.prototype, "referenceImagesBase64", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '首帧图片的 Base64 编码（帧插值模式）',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10_000_000),
    __metadata("design:type", String)
], CreateVideoTaskDto.prototype, "firstFrameBase64", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '尾帧图片的 Base64 编码（帧插值模式）',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10_000_000),
    __metadata("design:type", String)
], CreateVideoTaskDto.prototype, "lastFrameBase64", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '尾帧图片 URL（帧插值模式）',
        example: 'https://example.com/tail.jpg',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateVideoTaskDto.prototype, "tailImageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '视频 URL（video-to-video 模式必填）',
        example: 'https://example.com/video.mp4',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateVideoTaskDto.prototype, "videoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '视频时长（秒）',
        example: 8,
        enum: [4, 5, 6, 7, 8],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(4),
    (0, class_validator_1.Max)(8),
    __metadata("design:type", Number)
], CreateVideoTaskDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '视频宽高比',
        enum: AspectRatio,
        example: AspectRatio.LANDSCAPE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(AspectRatio),
    __metadata("design:type", String)
], CreateVideoTaskDto.prototype, "aspectRatio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '视频分辨率',
        enum: Resolution,
        example: Resolution.HD_720P,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(Resolution),
    __metadata("design:type", String)
], CreateVideoTaskDto.prototype, "resolution", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '负面提示词（避免的元素）',
        example: 'blurry, low quality, distorted',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVideoTaskDto.prototype, "negativePrompt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '随机种子（相同种子生成相似结果）',
        example: 42,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateVideoTaskDto.prototype, "seed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '是否增强提示词',
        example: true,
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateVideoTaskDto.prototype, "enhancePrompt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '是否生成音频',
        example: true,
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateVideoTaskDto.prototype, "generateAudio", void 0);
//# sourceMappingURL=create-video-task.dto.js.map