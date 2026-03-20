declare module '@alicloud/sms-sdk' {
  interface SmsOptions {
    accessKeyId: string;
    secretAccessKey: string;
  }

  interface SendSmsOptions {
    PhoneNumbers: string;
    SignName: string;
    TemplateCode: string;
    TemplateParam: string;
  }

  interface SendSmsResult {
    Code: string;
    Message: string;
  }

  class SmsClient {
    constructor(options: SmsOptions);
    sendSMS(options: SendSmsOptions): Promise<SendSmsResult>;
  }

  export = SmsClient;
}
