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
var LocalStorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
let LocalStorageService = LocalStorageService_1 = class LocalStorageService {
    configService;
    logger = new common_1.Logger(LocalStorageService_1.name);
    uploadDir;
    baseUrl;
    constructor(configService) {
        this.configService = configService;
        this.uploadDir = path.join(process.cwd(), 'uploads');
        const port = this.configService.get('PORT', '3000');
        this.baseUrl = `http://localhost:${port}/uploads`;
        this.ensureUploadDir();
    }
    async ensureUploadDir() {
        try {
            await fs.access(this.uploadDir);
        }
        catch {
            await fs.mkdir(this.uploadDir, { recursive: true });
            this.logger.log(`Created uploads directory: ${this.uploadDir}`);
        }
    }
    async upload(file, folder) {
        const folderPath = path.join(this.uploadDir, folder);
        try {
            await fs.access(folderPath);
        }
        catch {
            await fs.mkdir(folderPath, { recursive: true });
        }
        const ext = file.originalname.split('.').pop();
        const filename = `${(0, uuid_1.v4)()}.${ext}`;
        const key = `${folder}/${filename}`;
        const filePath = path.join(this.uploadDir, key);
        await fs.writeFile(filePath, file.buffer);
        const url = `${this.baseUrl}/${key}`;
        this.logger.log(`File uploaded locally: ${key}`);
        return {
            key,
            url,
            bucket: 'local',
            size: file.size,
        };
    }
    async delete(key) {
        const filePath = path.join(this.uploadDir, key);
        try {
            await fs.unlink(filePath);
            this.logger.log(`File deleted: ${key}`);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    async exists(key) {
        const filePath = path.join(this.uploadDir, key);
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    getPublicUrl(key) {
        return `${this.baseUrl}/${key}`;
    }
    async getSignedUrl(key, expiresIn = 3600) {
        return this.getPublicUrl(key);
    }
};
exports.LocalStorageService = LocalStorageService;
exports.LocalStorageService = LocalStorageService = LocalStorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LocalStorageService);
//# sourceMappingURL=local-storage.service.js.map