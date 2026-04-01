import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly logger;
    private client;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    setOtp(phone: string, otp: string, purpose?: 'login' | 'register' | 'reset'): Promise<void>;
    getOtp(phone: string, purpose?: 'login' | 'register' | 'reset'): Promise<string | null>;
    deleteOtp(phone: string, purpose?: 'login' | 'register' | 'reset'): Promise<void>;
    checkOtpVerifyLimit(identifier: string, purpose: 'login' | 'register' | 'reset'): Promise<boolean>;
    incrementOtpVerifyAttempt(identifier: string, purpose: 'login' | 'register' | 'reset'): Promise<void>;
    clearOtpVerifyAttempts(identifier: string, purpose: 'login' | 'register' | 'reset'): Promise<void>;
    checkOtpRateLimit(phone: string): Promise<boolean>;
    setRefreshToken(userId: number, token: string): Promise<void>;
    getRefreshToken(userId: number): Promise<string | null>;
    deleteRefreshToken(userId: number): Promise<void>;
    setEmailOtp(email: string, otp: string, purpose?: 'register' | 'reset'): Promise<void>;
    getEmailOtp(email: string, purpose?: 'register' | 'reset'): Promise<string | null>;
    deleteEmailOtp(email: string, purpose?: 'register' | 'reset'): Promise<void>;
    checkEmailOtpRateLimit(email: string): Promise<boolean>;
    private parseDuration;
}
