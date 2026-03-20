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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    configService;
    logger = new common_1.Logger(RedisService_1.name);
    client;
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        const host = this.configService.get('REDIS_HOST', 'localhost');
        const port = this.configService.get('REDIS_PORT', 6379);
        const password = this.configService.get('REDIS_PASSWORD');
        this.client = new ioredis_1.default({
            host,
            port,
            password: password || undefined,
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });
        this.client.on('connect', () => {
            this.logger.log('Redis client connected');
        });
        this.client.on('error', (err) => {
            this.logger.error(`Redis client error: ${err.message}`);
        });
    }
    async onModuleDestroy() {
        await this.client.quit();
        this.logger.log('Redis client disconnected');
    }
    async setOtp(phone, otp) {
        const key = `otp:${phone}`;
        await this.client.setex(key, 300, otp);
    }
    async getOtp(phone) {
        const key = `otp:${phone}`;
        return await this.client.get(key);
    }
    async deleteOtp(phone) {
        const key = `otp:${phone}`;
        await this.client.del(key);
    }
    async checkOtpRateLimit(phone) {
        const key = `otp:ratelimit:${phone}`;
        const exists = await this.client.exists(key);
        if (exists) {
            return false;
        }
        await this.client.setex(key, 60, '1');
        return true;
    }
    async setRefreshToken(userId, token) {
        const key = `refresh_token:${userId}`;
        const expiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d');
        const ttl = this.parseDuration(expiresIn);
        await this.client.setex(key, ttl, token);
    }
    async getRefreshToken(userId) {
        const key = `refresh_token:${userId}`;
        return await this.client.get(key);
    }
    async deleteRefreshToken(userId) {
        const key = `refresh_token:${userId}`;
        await this.client.del(key);
    }
    async setEmailOtp(email, otp) {
        const key = `otp:email:${email}`;
        await this.client.setex(key, 300, otp);
    }
    async getEmailOtp(email) {
        const key = `otp:email:${email}`;
        return await this.client.get(key);
    }
    async deleteEmailOtp(email) {
        const key = `otp:email:${email}`;
        await this.client.del(key);
    }
    async checkEmailOtpRateLimit(email) {
        const key = `otp:ratelimit:email:${email}`;
        const exists = await this.client.exists(key);
        if (exists)
            return false;
        await this.client.setex(key, 60, '1');
        return true;
    }
    parseDuration(duration) {
        const match = duration.match(/^(\d+)([smhd])$/);
        if (!match) {
            return 86400;
        }
        const value = parseInt(match[1], 10);
        const unit = match[2];
        const multipliers = {
            s: 1,
            m: 60,
            h: 3600,
            d: 86400,
        };
        return value * multipliers[unit];
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map