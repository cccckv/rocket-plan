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
exports.VideoTaskResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class VideoTaskResponseDto {
    id;
    userId;
    type;
    model;
    prompt;
    imageUrl;
    videoUrl;
    status;
    resultUrl;
    localPath;
    thumbnailUrl;
    duration;
    metadata;
    errorMsg;
    createdAt;
    updatedAt;
}
exports.VideoTaskResponseDto = VideoTaskResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '任务 ID', example: 'uuid-string' }),
    __metadata("design:type", String)
], VideoTaskResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户 ID', example: 1 }),
    __metadata("design:type", Number)
], VideoTaskResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '任务类型',
        example: 'text-to-video',
    }),
    __metadata("design:type", String)
], VideoTaskResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'AI 模型', example: 'google/veo-3.0-fast' }),
    __metadata("design:type", String)
], VideoTaskResponseDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '提示词',
        example: 'A cat playing in a garden',
    }),
    __metadata("design:type", String)
], VideoTaskResponseDto.prototype, "prompt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '图片 URL',
        example: 'https://example.com/image.jpg',
    }),
    __metadata("design:type", String)
], VideoTaskResponseDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '视频 URL',
        example: 'https://example.com/video.mp4',
    }),
    __metadata("design:type", String)
], VideoTaskResponseDto.prototype, "videoUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '任务状态',
        example: 'generating',
        enum: ['pending', 'queued', 'generating', 'completed', 'failed'],
    }),
    __metadata("design:type", String)
], VideoTaskResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '生成的视频 URL',
        example: 'https://cdn.example.com/generated-video.mp4',
    }),
    __metadata("design:type", String)
], VideoTaskResponseDto.prototype, "resultUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '本地存储路径',
        example: '/uploads/videos/uuid.mp4',
    }),
    __metadata("design:type", String)
], VideoTaskResponseDto.prototype, "localPath", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '缩略图 URL',
        example: 'https://cdn.example.com/thumbnail.jpg',
    }),
    __metadata("design:type", String)
], VideoTaskResponseDto.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '视频时长（秒）', example: 8 }),
    __metadata("design:type", Number)
], VideoTaskResponseDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '元数据（JSON）',
        example: { resolution: '720P', aspectRatio: '16:9' },
    }),
    __metadata("design:type", Object)
], VideoTaskResponseDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '错误信息',
        example: 'Generation failed: timeout',
    }),
    __metadata("design:type", String)
], VideoTaskResponseDto.prototype, "errorMsg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    __metadata("design:type", Date)
], VideoTaskResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    __metadata("design:type", Date)
], VideoTaskResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=video-task-response.dto.js.map