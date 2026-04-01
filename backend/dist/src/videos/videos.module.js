"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideosModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const videos_controller_1 = require("./videos.controller");
const videos_service_1 = require("./videos.service");
const aiapikey_service_1 = require("./services/aiapikey.service");
const video_storage_service_1 = require("./services/video-storage.service");
const image_util_service_1 = require("./services/image-util.service");
const prisma_module_1 = require("../prisma/prisma.module");
const credits_module_1 = require("../credits/credits.module");
let VideosModule = class VideosModule {
};
exports.VideosModule = VideosModule;
exports.VideosModule = VideosModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, prisma_module_1.PrismaModule, credits_module_1.CreditsModule],
        controllers: [videos_controller_1.VideosController],
        providers: [videos_service_1.VideosService, aiapikey_service_1.AIApiKeyService, video_storage_service_1.VideoStorageService, image_util_service_1.ImageUtilService],
        exports: [videos_service_1.VideosService],
    })
], VideosModule);
//# sourceMappingURL=videos.module.js.map