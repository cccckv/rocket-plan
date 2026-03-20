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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const ali_oss_1 = __importDefault(require("ali-oss"));
const uuid_1 = require("uuid");
const local_storage_service_1 = require("./local-storage.service");
let StorageService = StorageService_1 = class StorageService {
    configService;
    logger = new common_1.Logger(StorageService_1.name);
    provider;
    s3Client;
    ossClient;
    localStorage;
    bucket;
    constructor(configService) {
        this.configService = configService;
        this.provider = this.configService.get('STORAGE_PROVIDER', 'local');
        this.bucket = '';
        if (this.provider === 's3') {
            this.initS3();
        }
        else if (this.provider === 'oss') {
            this.initOSS();
        }
        else if (this.provider === 'local') {
            this.initLocal();
        }
    }
    initLocal() {
        this.localStorage = new local_storage_service_1.LocalStorageService(this.configService);
        this.bucket = 'local';
        this.logger.log('Local storage initialized');
    }
    initS3() {
        const region = this.configService.get('AWS_REGION');
        const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
        this.bucket = this.configService.get('AWS_S3_BUCKET', '');
        if (!region || !accessKeyId || !secretAccessKey || !this.bucket) {
            this.logger.warn('AWS S3 credentials not configured');
            return;
        }
        this.s3Client = new client_s3_1.S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
        this.logger.log(`AWS S3 client initialized (region: ${region}, bucket: ${this.bucket})`);
    }
    initOSS() {
        const region = this.configService.get('OSS_REGION');
        const accessKeyId = this.configService.get('OSS_ACCESS_KEY_ID');
        const accessKeySecret = this.configService.get('OSS_ACCESS_KEY_SECRET');
        this.bucket = this.configService.get('OSS_BUCKET', '');
        if (!region || !accessKeyId || !accessKeySecret || !this.bucket) {
            this.logger.warn('Alibaba Cloud OSS credentials not configured');
            return;
        }
        this.ossClient = new ali_oss_1.default({
            region,
            accessKeyId,
            accessKeySecret,
            bucket: this.bucket,
        });
        this.logger.log(`Alibaba Cloud OSS client initialized (region: ${region}, bucket: ${this.bucket})`);
    }
    async upload(file, folder) {
        if (this.provider === 'local') {
            return this.localStorage.upload(file, folder);
        }
        const ext = file.originalname.split('.').pop();
        const key = `${folder}/${(0, uuid_1.v4)()}.${ext}`;
        if (this.provider === 's3') {
            return this.uploadToS3(file, key);
        }
        else if (this.provider === 'oss') {
            return this.uploadToOSS(file, key);
        }
        throw new common_1.BadRequestException('Storage provider not configured');
    }
    async uploadToS3(file, key) {
        if (!this.s3Client) {
            throw new common_1.BadRequestException('S3 client not initialized');
        }
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        });
        await this.s3Client.send(command);
        const url = `https://${this.bucket}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;
        this.logger.log(`File uploaded to S3: ${key}`);
        return {
            key,
            url,
            bucket: this.bucket,
            size: file.size,
        };
    }
    async uploadToOSS(file, key) {
        if (!this.ossClient) {
            throw new common_1.BadRequestException('OSS client not initialized');
        }
        const result = await this.ossClient.put(key, file.buffer, {
            mime: file.mimetype,
        });
        this.logger.log(`File uploaded to OSS: ${key}`);
        return {
            key,
            url: result.url,
            bucket: this.bucket,
            size: file.size,
        };
    }
    async getSignedUrl(key, expiresIn = 3600) {
        if (this.provider === 'local') {
            return this.localStorage.getSignedUrl(key, expiresIn);
        }
        if (this.provider === 's3') {
            return this.getS3SignedUrl(key, expiresIn);
        }
        else if (this.provider === 'oss') {
            return this.getOSSSignedUrl(key, expiresIn);
        }
        throw new common_1.BadRequestException('Storage provider not configured');
    }
    async getS3SignedUrl(key, expiresIn) {
        if (!this.s3Client) {
            throw new common_1.BadRequestException('S3 client not initialized');
        }
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        return await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
    }
    async getOSSSignedUrl(key, expiresIn) {
        if (!this.ossClient) {
            throw new common_1.BadRequestException('OSS client not initialized');
        }
        return this.ossClient.signatureUrl(key, { expires: expiresIn });
    }
    async delete(key) {
        if (this.provider === 'local') {
            await this.localStorage.delete(key);
            return;
        }
        if (this.provider === 's3') {
            await this.deleteFromS3(key);
        }
        else if (this.provider === 'oss') {
            await this.deleteFromOSS(key);
        }
        else {
            throw new common_1.BadRequestException('Storage provider not configured');
        }
        this.logger.log(`File deleted: ${key}`);
    }
    async deleteFromS3(key) {
        if (!this.s3Client) {
            throw new common_1.BadRequestException('S3 client not initialized');
        }
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        await this.s3Client.send(command);
    }
    async deleteFromOSS(key) {
        if (!this.ossClient) {
            throw new common_1.BadRequestException('OSS client not initialized');
        }
        await this.ossClient.delete(key);
    }
    async exists(key) {
        try {
            if (this.provider === 'local') {
                return await this.localStorage.exists(key);
            }
            if (this.provider === 's3') {
                return await this.existsInS3(key);
            }
            else if (this.provider === 'oss') {
                return await this.existsInOSS(key);
            }
            return false;
        }
        catch (error) {
            return false;
        }
    }
    async existsInS3(key) {
        if (!this.s3Client) {
            return false;
        }
        try {
            const command = new client_s3_1.HeadObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            await this.s3Client.send(command);
            return true;
        }
        catch {
            return false;
        }
    }
    async existsInOSS(key) {
        if (!this.ossClient) {
            return false;
        }
        try {
            await this.ossClient.head(key);
            return true;
        }
        catch {
            return false;
        }
    }
    getPublicUrl(key) {
        if (this.provider === 'local') {
            return this.localStorage.getPublicUrl(key);
        }
        if (this.provider === 's3') {
            const region = this.configService.get('AWS_REGION');
            return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
        }
        else if (this.provider === 'oss') {
            const region = this.configService.get('OSS_REGION');
            return `https://${this.bucket}.${region}.aliyuncs.com/${key}`;
        }
        throw new common_1.BadRequestException('Storage provider not configured');
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map