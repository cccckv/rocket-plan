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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const storage_service_1 = require("./storage.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let StorageController = class StorageController {
    storageService;
    constructor(storageService) {
        this.storageService = storageService;
    }
    async uploadFile(file, folder) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const validFolders = ['materials', 'videos', 'bgm', 'templates'];
        if (!validFolders.includes(folder)) {
            throw new common_1.BadRequestException('Invalid folder. Must be: materials, videos, bgm, or templates');
        }
        const result = await this.storageService.upload(file, folder);
        return {
            message: 'File uploaded successfully',
            ...result,
        };
    }
    async getSignedUrl(key, expiresIn) {
        const expires = expiresIn ? parseInt(expiresIn, 10) : 3600;
        const url = await this.storageService.getSignedUrl(key, expires);
        return {
            url,
            expiresIn: expires,
        };
    }
    async deleteFile(key) {
        await this.storageService.delete(key);
        return {
            message: 'File deleted successfully',
            key,
        };
    }
    async checkExists(key) {
        const exists = await this.storageService.exists(key);
        return {
            exists,
            key,
        };
    }
    async getPublicUrl(key) {
        const url = this.storageService.getPublicUrl(key);
        return {
            url,
            key,
        };
    }
};
exports.StorageController = StorageController;
__decorate([
    (0, common_1.Post)('upload/:folder'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Param)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)('signed-url/*key'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Query)('expiresIn')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "getSignedUrl", null);
__decorate([
    (0, common_1.Delete)('*key'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "deleteFile", null);
__decorate([
    (0, common_1.Get)('exists/*key'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "checkExists", null);
__decorate([
    (0, common_1.Get)('public-url/*key'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "getPublicUrl", null);
exports.StorageController = StorageController = __decorate([
    (0, common_1.Controller)('storage'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [storage_service_1.StorageService])
], StorageController);
//# sourceMappingURL=storage.controller.js.map