import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from './services/sms.service';
import { RedisService } from './services/redis.service';
import { EmailService } from './services/email.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private smsService;
    private redisService;
    private emailService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, smsService: SmsService, redisService: RedisService, emailService: EmailService);
    sendOtp(phone: string, purpose?: 'login' | 'register' | 'reset'): Promise<{
        message: string;
    }>;
    verifyOtp(phone: string, otp: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
        user: {
            id: number;
            phone: string | null;
            email: string;
            credits: number;
            tier: string;
            hasPassword: boolean;
        };
    }>;
    register(name: string, email: string, otp: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
        user: {
            id: number;
            name: string | null;
            email: string;
            credits: number;
            tier: string;
            hasPassword: boolean;
        };
    }>;
    registerWithPhone(phone: string, otp: string, email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
        user: {
            id: number;
            phone: string | null;
            email: string;
            credits: number;
            tier: string;
            hasPassword: boolean;
        };
    }>;
    login(account: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
        user: {
            id: number;
            name: string | null;
            phone: string | null;
            email: string;
            credits: number;
            tier: string;
            hasPassword: boolean;
        };
    }>;
    googleLogin(googleId: string, email: string, displayName?: string, emailVerified?: boolean): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
        user: {
            id: number;
            name: string | null;
            googleId: string | null;
            email: string;
            credits: number;
            tier: string;
            hasPassword: boolean;
        };
    }>;
    setPassword(userId: number, password: string): Promise<{
        message: string;
    }>;
    sendEmailOtp(email: string, purpose?: 'register' | 'reset'): Promise<{
        message: string;
    }>;
    resetPassword(phone: string, otp: string, newPassword: string): Promise<{
        message: string;
    }>;
    resetPasswordEmail(email: string, otp: string, newPassword: string): Promise<{
        message: string;
    }>;
    refreshToken(userId: number, refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    }>;
    logout(userId: number): Promise<{
        message: string;
    }>;
    getFullUser(userId: number): Promise<{
        id: number;
        name: string | null;
        phone: string | null;
        googleId: string | null;
        email: string;
        credits: number;
        tier: string;
        hasPassword: boolean;
    }>;
    private generateTokens;
}
