"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sms_sdk_1 = __importDefault(require("@alicloud/sms-sdk"));
const twilio_1 = require("twilio");
let SmsService = SmsService_1 = class SmsService {
    configService;
    logger = new common_1.Logger(SmsService_1.name);
    aliClient;
    twilioClient = null;
    constructor(configService) {
        this.configService = configService;
        const aliAccessKeyId = this.configService.get('ALIBABA_ACCESS_KEY_ID');
        const aliAccessKeySecret = this.configService.get('ALIBABA_ACCESS_KEY_SECRET');
        if (aliAccessKeyId && aliAccessKeySecret) {
            this.aliClient = new sms_sdk_1.default({
                accessKeyId: aliAccessKeyId,
                secretAccessKey: aliAccessKeySecret,
            });
            this.logger.log('Alibaba Cloud SMS client initialized');
        }
        else {
            this.logger.warn('Alibaba Cloud SMS credentials not configured');
        }
        const twilioAccountSid = this.configService.get('TWILIO_ACCOUNT_SID');
        const twilioAuthToken = this.configService.get('TWILIO_AUTH_TOKEN');
        if (twilioAccountSid && twilioAuthToken) {
            this.twilioClient = new twilio_1.Twilio(twilioAccountSid, twilioAuthToken);
            this.logger.log('Twilio SMS client initialized');
        }
        else {
            this.logger.warn('Twilio SMS credentials not configured');
        }
    }
    async sendOtp(phone, otp) {
        const isDev = this.configService.get('NODE_ENV') === 'development';
        if (isDev) {
            this.logger.warn(`[DEV MODE] SMS OTP for ${phone}: ${otp}`);
            return;
        }
        const isChineseNumber = phone.startsWith('+86');
        if (isChineseNumber) {
            await this.sendVialibabaCloud(phone, otp);
        }
        else {
            await this.sendViaTwilio(phone, otp);
        }
    }
    async sendVialibabaCloud(phone, otp) {
        if (!this.aliClient) {
            throw new Error('Alibaba Cloud SMS client not configured');
        }
        const signName = this.configService.get('ALIBABA_SMS_SIGN_NAME');
        const templateCode = this.configService.get('ALIBABA_SMS_TEMPLATE_CODE');
        if (!signName || !templateCode) {
            throw new Error('Alibaba Cloud SMS sign name or template code not configured');
        }
        try {
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
        }
        catch (error) {
            this.logger.error(`Failed to send SMS via Alibaba Cloud: ${error.message}`);
            throw error;
        }
    }
    async sendViaTwilio(phone, otp) {
        if (!this.twilioClient) {
            throw new Error('Twilio SMS client not configured');
        }
        const twilioPhoneNumber = this.configService.get('TWILIO_PHONE_NUMBER');
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
        }
        catch (error) {
            this.logger.error(`Failed to send SMS via Twilio: ${error.message}`);
            throw error;
        }
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmsService);
//# sourceMappingURL=sms.service.js.map