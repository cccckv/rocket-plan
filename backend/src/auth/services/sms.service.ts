import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AliSMS from '@alicloud/sms-sdk';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private aliClient: any;
  private twilioClient: Twilio | null = null;

  constructor(private configService: ConfigService) {
    // 初始化阿里云 SMS 客户端
    const aliAccessKeyId = this.configService.get<string>('ALIBABA_ACCESS_KEY_ID');
    const aliAccessKeySecret = this.configService.get<string>('ALIBABA_ACCESS_KEY_SECRET');
    
    if (aliAccessKeyId && aliAccessKeySecret) {
      this.aliClient = new AliSMS({
        accessKeyId: aliAccessKeyId,
        secretAccessKey: aliAccessKeySecret,
      });
      this.logger.log('Alibaba Cloud SMS client initialized');
    } else {
      this.logger.warn('Alibaba Cloud SMS credentials not configured');
    }

    // 初始化 Twilio 客户端
    const twilioAccountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    
    if (twilioAccountSid && twilioAuthToken && twilioAccountSid.startsWith('AC')) {
      this.twilioClient = new Twilio(twilioAccountSid, twilioAuthToken);
      this.logger.log('Twilio SMS client initialized');
    } else {
      this.logger.warn('Twilio SMS credentials not configured');
    }
  }

  /**
   * 发送验证码短信（自动路由）
   */
  async sendOtp(phone: string, otp: string): Promise<void> {
    const isDev = this.configService.get<string>('NODE_ENV') === 'development';

    if (isDev) {
      this.logger.warn(`[DEV MODE] SMS OTP for ${phone}: ${otp}`);
      return;
    }

    const isChineseNumber = phone.startsWith('+86');

    if (isChineseNumber) {
      await this.sendVialibabaCloud(phone, otp);
    } else {
      await this.sendViaTwilio(phone, otp);
    }
  }

  /**
   * 通过阿里云发送短信 (中国大陆)
   */
  private async sendVialibabaCloud(phone: string, otp: string): Promise<void> {
    if (!this.aliClient) {
      throw new Error('Alibaba Cloud SMS client not configured');
    }

    const signName = this.configService.get<string>('ALIBABA_SMS_SIGN_NAME');
    const templateCode = this.configService.get<string>('ALIBABA_SMS_TEMPLATE_CODE');

    if (!signName || !templateCode) {
      throw new Error('Alibaba Cloud SMS sign name or template code not configured');
    }

    try {
      // 移除 +86 前缀
      const phoneNumber = phone.replace(/^\+86/, '');

      const result = await this.aliClient.sendSMS({
        PhoneNumbers: phoneNumber,
        SignName: signName,
        TemplateCode: templateCode,
        TemplateParam: JSON.stringify({ code: otp }),
      });

      if (result.Code !== 'OK') {
        this.logger.error(`Alibaba Cloud SMS failed: ${result.Message}`);
        throw new Error(`SMS send failed: ${result.Message}`);
      }

      this.logger.log(`SMS sent via Alibaba Cloud to ${phone}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS via Alibaba Cloud: ${error.message}`);
      throw error;
    }
  }

  /**
   * 通过 Twilio 发送短信 (国际)
   */
  private async sendViaTwilio(phone: string, otp: string): Promise<void> {
    if (!this.twilioClient) {
      throw new Error('Twilio SMS client not configured');
    }

    const twilioPhoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
    
    if (!twilioPhoneNumber) {
      throw new Error('Twilio phone number not configured');
    }

    try {
      await this.twilioClient.messages.create({
        body: `Your verification code is: ${otp}. Valid for 5 minutes.`,
        from: twilioPhoneNumber,
        to: phone,
      });

      this.logger.log(`SMS sent via Twilio to ${phone}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS via Twilio: ${error.message}`);
      throw error;
    }
  }
}
