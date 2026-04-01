import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from './services/sms.service';
import { RedisService } from './services/redis.service';
import { EmailService } from './services/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private smsService: SmsService,
    private redisService: RedisService,
    private emailService: EmailService,
  ) {}

  async sendOtp(phone: string, purpose: 'login' | 'register' | 'reset' = 'login'): Promise<{ message: string }> {
    const canSend = await this.redisService.checkOtpRateLimit(phone);
    if (!canSend) {
      throw new BadRequestException('Please wait 60 seconds before requesting another OTP');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisService.setOtp(phone, otp, purpose);

    try {
      await this.smsService.sendOtp(phone, otp);
      this.logger.log(`OTP (${purpose}) sent to ${phone}`);
      return { message: 'OTP sent successfully' };
    } catch (error) {
      this.logger.error(`Failed to send OTP: ${error.message}`);
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }
  }

  async verifyOtp(phone: string, otp: string) {
    const purpose = 'login';
    
    const canVerify = await this.redisService.checkOtpVerifyLimit(phone, purpose);
    if (!canVerify) {
      throw new BadRequestException('Too many failed attempts. Please try again in 10 minutes.');
    }

    const storedOtp = await this.redisService.getOtp(phone, purpose);
    if (!storedOtp) throw new BadRequestException('OTP expired or not found');
    
    if (storedOtp !== otp) {
      await this.redisService.incrementOtpVerifyAttempt(phone, purpose);
      throw new BadRequestException('Invalid OTP');
    }

    await this.redisService.deleteOtp(phone, purpose);
    await this.redisService.clearOtpVerifyAttempts(phone, purpose);

    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new BadRequestException('Phone number not registered. Please register first.');
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

  async register(name: string, email: string, otp: string, password: string) {
    const normalizedEmail = email.toLowerCase();
    const purpose = 'register';
    
    const canVerify = await this.redisService.checkOtpVerifyLimit(normalizedEmail, purpose);
    if (!canVerify) {
      throw new BadRequestException('Too many failed attempts. Please try again in 10 minutes.');
    }

    const storedOtp = await this.redisService.getEmailOtp(normalizedEmail, purpose);
    if (!storedOtp) throw new BadRequestException('OTP expired or not found');
    
    if (storedOtp !== otp) {
      await this.redisService.incrementOtpVerifyAttempt(normalizedEmail, purpose);
      throw new BadRequestException('Invalid OTP');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    await this.redisService.deleteEmailOtp(normalizedEmail, purpose);
    await this.redisService.clearOtpVerifyAttempts(normalizedEmail, purpose);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        credits: 2,
        tier: 'free',
      },
    });

    this.logger.log(`New user registered via email: ${normalizedEmail}`);

    const tokens = await this.generateTokens(user.id, undefined, undefined, normalizedEmail);
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

  async registerWithPhone(phone: string, otp: string, email: string, password: string) {
    const normalizedEmail = email.toLowerCase();
    const purpose = 'register';
    
    const canVerify = await this.redisService.checkOtpVerifyLimit(phone, purpose);
    if (!canVerify) {
      throw new BadRequestException('Too many failed attempts. Please try again in 10 minutes.');
    }

    const storedOtp = await this.redisService.getOtp(phone, purpose);
    if (!storedOtp) throw new BadRequestException('OTP expired or not found');
    
    if (storedOtp !== otp) {
      await this.redisService.incrementOtpVerifyAttempt(phone, purpose);
      throw new BadRequestException('Invalid OTP');
    }

    const existingPhone = await this.prisma.user.findUnique({ where: { phone } });
    if (existingPhone) throw new BadRequestException('Phone number already registered');

    const existingEmail = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingEmail) throw new BadRequestException('Email already registered. Please login with that email and bind your phone in settings.');

    await this.redisService.deleteOtp(phone, purpose);
    await this.redisService.clearOtpVerifyAttempts(phone, purpose);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        phone,
        email: normalizedEmail,
        password: hashedPassword,
        credits: 2,
        tier: 'free',
      },
    });

    this.logger.log(`New user registered via phone: ${phone}, email: ${normalizedEmail}`);

    const tokens = await this.generateTokens(user.id, phone, undefined, normalizedEmail);
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

  async login(account: string, password: string) {
    const isEmail = account.includes('@');
    const normalizedAccount = isEmail ? account.toLowerCase() : account;

    const user = isEmail
      ? await this.prisma.user.findUnique({ where: { email: normalizedAccount } })
      : await this.prisma.user.findUnique({ where: { phone: normalizedAccount } });

    if (!user) throw new BadRequestException('Account not found');

    if (!user.password) {
      throw new BadRequestException('This account was registered via Google. Please use Google to sign in.');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new BadRequestException('Invalid password');

    const tokens = await this.generateTokens(user.id, user.phone ?? undefined, user.googleId ?? undefined, user.email);
    await this.redisService.setRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`User logged in: ${normalizedAccount}`);

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

  async googleLogin(googleId: string, email: string, displayName?: string, emailVerified?: boolean) {
    const normalizedEmail = email.toLowerCase();
    
    if (!emailVerified) {
      throw new BadRequestException('Google email is not verified. Please verify your email with Google first.');
    }

    let user = await this.prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

      if (existingUser) {
        user = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { googleId, name: existingUser.name || displayName },
        });
        this.logger.log(`Google ID linked to existing user: ${normalizedEmail}`);
      } else {
        user = await this.prisma.user.create({
          data: {
            googleId,
            email: normalizedEmail,
            name: displayName,
            credits: 2,
            tier: 'free',
          },
        });
        this.logger.log(`New user registered via Google: ${normalizedEmail}`);
      }
    }

    const tokens = await this.generateTokens(user.id, user.phone ?? undefined, googleId, normalizedEmail);
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

  async setPassword(userId: number, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    this.logger.log(`User ${userId} set password`);
    return { message: 'Password set successfully' };
  }

  async sendEmailOtp(email: string, purpose: 'register' | 'reset' = 'register') {
    const normalizedEmail = email.toLowerCase();
    
    const canSend = await this.redisService.checkEmailOtpRateLimit(normalizedEmail);
    if (!canSend) {
      throw new BadRequestException('Please wait 60 seconds before requesting another OTP');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisService.setEmailOtp(normalizedEmail, otp, purpose);

    await this.emailService.sendOtp(normalizedEmail, otp);
    this.logger.log(`Email OTP (${purpose}) sent to ${normalizedEmail}`);
    return { message: 'OTP sent successfully' };
  }

  async resetPassword(phone: string, otp: string, newPassword: string) {
    const purpose = 'reset';
    
    const canVerify = await this.redisService.checkOtpVerifyLimit(phone, purpose);
    if (!canVerify) {
      throw new BadRequestException('Too many failed attempts. Please try again in 10 minutes.');
    }

    const storedOtp = await this.redisService.getOtp(phone, purpose);
    if (!storedOtp) throw new BadRequestException('OTP expired or not found');
    
    if (storedOtp !== otp) {
      await this.redisService.incrementOtpVerifyAttempt(phone, purpose);
      throw new BadRequestException('Invalid OTP');
    }

    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new BadRequestException('Phone number not registered');

    await this.redisService.deleteOtp(phone, purpose);
    await this.redisService.clearOtpVerifyAttempts(phone, purpose);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    this.logger.log(`User ${user.id} reset password via phone`);
    return { message: 'Password reset successfully' };
  }

  async resetPasswordEmail(email: string, otp: string, newPassword: string) {
    const normalizedEmail = email.toLowerCase();
    const purpose = 'reset';
    
    const canVerify = await this.redisService.checkOtpVerifyLimit(normalizedEmail, purpose);
    if (!canVerify) {
      throw new BadRequestException('Too many failed attempts. Please try again in 10 minutes.');
    }

    const storedOtp = await this.redisService.getEmailOtp(normalizedEmail, purpose);
    if (!storedOtp) throw new BadRequestException('OTP expired or not found');
    
    if (storedOtp !== otp) {
      await this.redisService.incrementOtpVerifyAttempt(normalizedEmail, purpose);
      throw new BadRequestException('Invalid OTP');
    }

    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) throw new BadRequestException('Email not registered');

    await this.redisService.deleteEmailOtp(normalizedEmail, purpose);
    await this.redisService.clearOtpVerifyAttempts(normalizedEmail, purpose);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    this.logger.log(`User ${user.id} reset password via email`);
    return { message: 'Password reset successfully' };
  }

  async refreshToken(userId: number, refreshToken: string) {
    const storedToken = await this.redisService.getRefreshToken(userId);

    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const tokens = await this.generateTokens(
      user.id,
      user.phone ?? undefined,
      user.googleId ?? undefined,
      user.email ?? undefined,
    );

    await this.redisService.setRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: number): Promise<{ message: string }> {
    await this.redisService.deleteRefreshToken(userId);
    this.logger.log(`User logged out: ${userId}`);
    return { message: 'Logged out successfully' };
  }

  async getFullUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
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

  private async generateTokens(
    userId: number,
    phone?: string,
    googleId?: string,
    email?: string,
  ) {
    const payload: Record<string, any> = { sub: userId };
    if (phone) payload.phone = phone;
    if (googleId) payload.googleId = googleId;
    if (email) payload.email = email;

    const accessExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: accessExpiresIn as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
    };
  }
}
