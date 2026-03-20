import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>('SMTP_PORT', 587),
        secure: false,
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
      this.logger.log('Email transporter initialized');
    } else {
      this.logger.warn('SMTP not configured, emails will be logged to console');
    }
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    const isDev = this.configService.get<string>('NODE_ENV') === 'development';

    if (isDev || !this.transporter) {
      this.logger.warn(`[DEV MODE] Email OTP for ${email}: ${otp}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM', 'noreply@rocketplan.com'),
      to: email,
      subject: 'Your verification code - Rocket Plan',
      html: `<p>Your verification code is: <strong>${otp}</strong></p><p>Valid for 5 minutes.</p>`,
    });

    this.logger.log(`Email OTP sent to ${email}`);
  }
}
