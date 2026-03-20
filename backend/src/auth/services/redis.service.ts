import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');

    this.client = new Redis({
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

  /**
   * 存储 OTP (5 分钟有效期)
   */
  async setOtp(phone: string, otp: string): Promise<void> {
    const key = `otp:${phone}`;
    await this.client.setex(key, 300, otp); // 5 minutes TTL
  }

  /**
   * 获取 OTP
   */
  async getOtp(phone: string): Promise<string | null> {
    const key = `otp:${phone}`;
    return await this.client.get(key);
  }

  /**
   * 删除 OTP
   */
  async deleteOtp(phone: string): Promise<void> {
    const key = `otp:${phone}`;
    await this.client.del(key);
  }

  /**
   * 检查 OTP 发送频率限制 (60 秒内只能发送一次)
   */
  async checkOtpRateLimit(phone: string): Promise<boolean> {
    const key = `otp:ratelimit:${phone}`;
    const exists = await this.client.exists(key);
    
    if (exists) {
      return false; // 频率限制中
    }

    // 设置 60 秒限制
    await this.client.setex(key, 60, '1');
    return true;
  }

  /**
   * 存储 Refresh Token
   */
  async setRefreshToken(userId: number, token: string): Promise<void> {
    const key = `refresh_token:${userId}`;
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
    const ttl = this.parseDuration(expiresIn);
    await this.client.setex(key, ttl, token);
  }

  /**
   * 获取 Refresh Token
   */
  async getRefreshToken(userId: number): Promise<string | null> {
    const key = `refresh_token:${userId}`;
    return await this.client.get(key);
  }

  /**
   * 删除 Refresh Token (登出)
   */
  async deleteRefreshToken(userId: number): Promise<void> {
    const key = `refresh_token:${userId}`;
    await this.client.del(key);
  }

  /**
   * 存储邮箱 OTP (5 分钟有效期)
   */
  async setEmailOtp(email: string, otp: string): Promise<void> {
    const key = `otp:email:${email}`;
    await this.client.setex(key, 300, otp);
  }

  /**
   * 获取邮箱 OTP
   */
  async getEmailOtp(email: string): Promise<string | null> {
    const key = `otp:email:${email}`;
    return await this.client.get(key);
  }

  /**
   * 删除邮箱 OTP
   */
  async deleteEmailOtp(email: string): Promise<void> {
    const key = `otp:email:${email}`;
    await this.client.del(key);
  }

  /**
   * 检查邮箱 OTP 发送频率限制 (60 秒)
   */
  async checkEmailOtpRateLimit(email: string): Promise<boolean> {
    const key = `otp:ratelimit:email:${email}`;
    const exists = await this.client.exists(key);
    if (exists) return false;
    await this.client.setex(key, 60, '1');
    return true;
  }

  /**
   * 解析时间字符串为秒数 (e.g., "7d" -> 604800, "30d" -> 2592000)
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 86400;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2] as 's' | 'm' | 'h' | 'd';

    const multipliers: Record<'s' | 'm' | 'h' | 'd', number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * multipliers[unit];
  }
}
