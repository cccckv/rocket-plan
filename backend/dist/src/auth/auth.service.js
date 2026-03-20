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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const sms_service_1 = require("./services/sms.service");
const redis_service_1 = require("./services/redis.service");
const email_service_1 = require("./services/email.service");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    configService;
    smsService;
    redisService;
    emailService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService, configService, smsService, redisService, emailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.smsService = smsService;
        this.redisService = redisService;
        this.emailService = emailService;
    }
    async sendOtp(phone) {
        const canSend = await this.redisService.checkOtpRateLimit(phone);
        if (!canSend) {
            throw new common_1.BadRequestException('Please wait 60 seconds before requesting another OTP');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await this.redisService.setOtp(phone, otp);
        try {
            await this.smsService.sendOtp(phone, otp);
            this.logger.log(`OTP sent to ${phone}`);
            return { message: 'OTP sent successfully' };
        }
        catch (error) {
            this.logger.error(`Failed to send OTP: ${error.message}`);
            throw new common_1.BadRequestException('Failed to send OTP. Please try again.');
        }
    }
    async verifyOtp(phone, otp) {
        const storedOtp = await this.redisService.getOtp(phone);
        if (!storedOtp)
            throw new common_1.BadRequestException('OTP expired or not found');
        if (storedOtp !== otp)
            throw new common_1.BadRequestException('Invalid OTP');
        await this.redisService.deleteOtp(phone);
        const user = await this.prisma.user.findUnique({ where: { phone } });
        if (!user) {
            throw new common_1.BadRequestException('Phone number not registered. Please register first.');
        }
        const tokens = await this.generateTokens(user.id, phone);
        await this.redisService.setRefreshToken(user.id, tokens.refreshToken);
        return {
            user: {
                id: user.id,
                phone: user.phone,
                email: user.email,
                credits: user.credits,
                tier: user.tier,
                hasPassword: !!user.password,
            },
            ...tokens,
        };
    }
    async register(name, email, otp, password) {
        const storedOtp = await this.redisService.getEmailOtp(email);
        if (!storedOtp)
            throw new common_1.BadRequestException('OTP expired or not found');
        if (storedOtp !== otp)
            throw new common_1.BadRequestException('Invalid OTP');
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new common_1.BadRequestException('Email already registered');
        }
        await this.redisService.deleteEmailOtp(email);
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                credits: 2,
                tier: 'free',
            },
        });
        this.logger.log(`New user registered via email: ${email}`);
        const tokens = await this.generateTokens(user.id, undefined, undefined, email);
        await this.redisService.setRefreshToken(user.id, tokens.refreshToken);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                credits: user.credits,
                tier: user.tier,
                hasPassword: true,
            },
            ...tokens,
        };
    }
    async registerWithPhone(phone, otp, email, password) {
        const storedOtp = await this.redisService.getOtp(phone);
        if (!storedOtp)
            throw new common_1.BadRequestException('OTP expired or not found');
        if (storedOtp !== otp)
            throw new common_1.BadRequestException('Invalid OTP');
        const existingPhone = await this.prisma.user.findUnique({ where: { phone } });
        if (existingPhone)
            throw new common_1.BadRequestException('Phone number already registered');
        const existingEmail = await this.prisma.user.findUnique({ where: { email } });
        if (existingEmail)
            throw new common_1.BadRequestException('Email already registered. Please login with that email and bind your phone in settings.');
        await this.redisService.deleteOtp(phone);
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                phone,
                email,
                password: hashedPassword,
                credits: 2,
                tier: 'free',
            },
        });
        this.logger.log(`New user registered via phone: ${phone}, email: ${email}`);
        const tokens = await this.generateTokens(user.id, phone, undefined, email);
        await this.redisService.setRefreshToken(user.id, tokens.refreshToken);
        return {
            user: {
                id: user.id,
                phone: user.phone,
                email: user.email,
                credits: user.credits,
                tier: user.tier,
                hasPassword: true,
            },
            ...tokens,
        };
    }
    async login(account, password) {
        const isEmail = account.includes('@');
        const user = isEmail
            ? await this.prisma.user.findUnique({ where: { email: account } })
            : await this.prisma.user.findUnique({ where: { phone: account } });
        if (!user)
            throw new common_1.BadRequestException('Account not found');
        if (!user.password) {
            throw new common_1.BadRequestException('This account was registered via Google. Please use Google to sign in.');
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid)
            throw new common_1.BadRequestException('Invalid password');
        const tokens = await this.generateTokens(user.id, user.phone ?? undefined, user.googleId ?? undefined, user.email);
        await this.redisService.setRefreshToken(user.id, tokens.refreshToken);
        this.logger.log(`User logged in: ${account}`);
        return {
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                credits: user.credits,
                tier: user.tier,
                hasPassword: true,
            },
            ...tokens,
        };
    }
    async googleLogin(googleId, email, displayName) {
        let user = await this.prisma.user.findUnique({ where: { googleId } });
        if (!user) {
            const existingUser = await this.prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                user = await this.prisma.user.update({
                    where: { id: existingUser.id },
                    data: { googleId, name: existingUser.name || displayName },
                });
                this.logger.log(`Google ID linked to existing user: ${email}`);
            }
            else {
                user = await this.prisma.user.create({
                    data: {
                        googleId,
                        email,
                        name: displayName,
                        credits: 2,
                        tier: 'free',
                    },
                });
                this.logger.log(`New user registered via Google: ${email}`);
            }
        }
        const tokens = await this.generateTokens(user.id, user.phone ?? undefined, googleId, email);
        await this.redisService.setRefreshToken(user.id, tokens.refreshToken);
        return {
            user: {
                id: user.id,
                name: user.name,
                googleId: user.googleId,
                email: user.email,
                credits: user.credits,
                tier: user.tier,
                hasPassword: !!user.password,
            },
            ...tokens,
        };
    }
    async setPassword(userId, password) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        this.logger.log(`User ${userId} set password`);
        return { message: 'Password set successfully' };
    }
    async sendEmailOtp(email) {
        const canSend = await this.redisService.checkEmailOtpRateLimit(email);
        if (!canSend) {
            throw new common_1.BadRequestException('Please wait 60 seconds before requesting another OTP');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await this.redisService.setEmailOtp(email, otp);
        await this.emailService.sendOtp(email, otp);
        this.logger.log(`Email OTP sent to ${email}`);
        return { message: 'OTP sent successfully' };
    }
    async resetPassword(phone, otp, newPassword) {
        const storedOtp = await this.redisService.getOtp(phone);
        if (!storedOtp)
            throw new common_1.BadRequestException('OTP expired or not found');
        if (storedOtp !== otp)
            throw new common_1.BadRequestException('Invalid OTP');
        const user = await this.prisma.user.findUnique({ where: { phone } });
        if (!user)
            throw new common_1.BadRequestException('Phone number not registered');
        await this.redisService.deleteOtp(phone);
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        this.logger.log(`User ${user.id} reset password via phone`);
        return { message: 'Password reset successfully' };
    }
    async resetPasswordEmail(email, otp, newPassword) {
        const storedOtp = await this.redisService.getEmailOtp(email);
        if (!storedOtp)
            throw new common_1.BadRequestException('OTP expired or not found');
        if (storedOtp !== otp)
            throw new common_1.BadRequestException('Invalid OTP');
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            throw new common_1.BadRequestException('Email not registered');
        await this.redisService.deleteEmailOtp(email);
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        this.logger.log(`User ${user.id} reset password via email`);
        return { message: 'Password reset successfully' };
    }
    async refreshToken(userId, refreshToken) {
        const storedToken = await this.redisService.getRefreshToken(userId);
        if (!storedToken || storedToken !== refreshToken) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        const tokens = await this.generateTokens(user.id, user.phone ?? undefined, user.googleId ?? undefined, user.email ?? undefined);
        await this.redisService.setRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }
    async logout(userId) {
        await this.redisService.deleteRefreshToken(userId);
        this.logger.log(`User logged out: ${userId}`);
        return { message: 'Logged out successfully' };
    }
    async getFullUser(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        return {
            id: user.id,
            name: user.name,
            phone: user.phone,
            googleId: user.googleId,
            email: user.email,
            credits: user.credits,
            tier: user.tier,
            hasPassword: !!user.password,
        };
    }
    async generateTokens(userId, phone, googleId, email) {
        const payload = { sub: userId };
        if (phone)
            payload.phone = phone;
        if (googleId)
            payload.googleId = googleId;
        if (email)
            payload.email = email;
        const accessExpiresIn = this.configService.get('JWT_EXPIRES_IN', '7d');
        const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d');
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: accessExpiresIn,
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: refreshExpiresIn,
            }),
        ]);
        return {
            accessToken,
            refreshToken,
            expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        sms_service_1.SmsService,
        redis_service_1.RedisService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map