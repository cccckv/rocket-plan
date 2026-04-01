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
   * 存储 OTP (5 分钟有效期) - 按用途隔离
   */
  async setOtp(phone: string, otp: string, purpose: 'login' | 'register' | 'reset' = 'login'): Promise<void> {
    const key = `otp:${purpose}:${phone}`;
    await this.client.setex(key, 300, otp); // 5 minutes TTL
  }

  /**
   * 获取 OTP - 按用途隔离
   */
  async getOtp(phone: string, purpose: 'login' | 'register' | 'reset' = 'login'): Promise<string | null> {
    const key = `otp:${purpose}:${phone}`;
    return await this.client.get(key);
  }

  /**
   * 删除 OTP - 按用途隔离
   */
  async deleteOtp(phone: string, purpose: 'login' | 'register' | 'reset' = 'login'): Promise<void> {
    const key = `otp:${purpose}:${phone}`;
    await this.client.del(key);
  }

  /**
   * 检查 OTP 验证次数限制 (5次失败后锁定10分钟)
   */
  async checkOtpVerifyLimit(identifier: string, purpose: 'login' | 'register' | 'reset'): Promise<boolean> {
    const key = `otp:verify:${purpose}:${identifier}`;
    const attempts = await this.client.get(key);
    
    if (attempts && parseInt(attempts, 10) >= 5) {
      return false; // 已达到验证次数限制
    }
    
    return true;
  }

  /**
   * 记录 OTP 验证失败次数
   */
  async incrementOtpVerifyAttempt(identifier: string, purpose: 'login' | 'register' | 'reset'): Promise<void> {
    const key = `otp:verify:${purpose}:${identifier}`;
    const current = await this.client.get(key);
    const attempts = current ? parseInt(current, 10) + 1 : 1;
    
    // 10分钟锁定期
    await this.client.setex(key, 600, attempts.toString());
  }

  /**
   * 清除 OTP 验证失败记录 (验证成功时调用)
   */
  async clearOtpVerifyAttempts(identifier: string, purpose: 'login' | 'register' | 'reset'): Promise<void> {
    const key = `otp:verify:${purpose}:${identifier}`;
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
   * 存储邮箱 OTP (5 分钟有效期) - 按用途隔离
   */
  async setEmailOtp(email: string, otp: string, purpose: 'register' | 'reset' = 'register'): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    const key = `otp:email:${purpose}:${normalizedEmail}`;
    await this.client.setex(key, 300, otp);
  }

  /**
   * 获取邮箱 OTP - 按用途隔离
   */
  async getEmailOtp(email: string, purpose: 'register' | 'reset' = 'register'): Promise<string | null> {
    const normalizedEmail = email.toLowerCase();
    const key = `otp:email:${purpose}:${normalizedEmail}`;
    return await this.client.get(key);
  }

  /**
   * 删除邮箱 OTP - 按用途隔离
   */
  async deleteEmailOtp(email: string, purpose: 'register' | 'reset' = 'register'): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    const key = `otp:email:${purpose}:${normalizedEmail}`;
    await this.client.del(key);
  }

  /**
   * 检查邮箱 OTP 发送频率限制 (60 秒)
   */
  async checkEmailOtpRateLimit(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase();
    const key = `otp:ratelimit:email:${normalizedEmail}`;
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
