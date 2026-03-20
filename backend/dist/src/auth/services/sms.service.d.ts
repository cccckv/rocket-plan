import { ConfigService } from '@nestjs/config';
export declare class SmsService {
    private configService;
    private readonly logger;
    private aliClient;
    private twilioClient;
    constructor(configService: ConfigService);
    sendOtp(phone: string, otp: string): Promise<void>;
    private sendVialibabaCloud;
    private sendViaTwilio;
}
