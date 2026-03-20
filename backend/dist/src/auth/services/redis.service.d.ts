import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly logger;
    private client;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    setOtp(phone: string, otp: string): Promise<void>;
    getOtp(phone: string): Promise<string | null>;
    deleteOtp(phone: string): Promise<void>;
    checkOtpRateLimit(phone: string): Promise<boolean>;
    setRefreshToken(userId: number, token: string): Promise<void>;
    getRefreshToken(userId: number): Promise<string | null>;
    deleteRefreshToken(userId: number): Promise<void>;
    setEmailOtp(email: string, otp: string): Promise<void>;
    getEmailOtp(email: string): Promise<string | null>;
    deleteEmailOtp(email: string): Promise<void>;
    checkEmailOtpRateLimit(email: string): Promise<boolean>;
    private parseDuration;
}
