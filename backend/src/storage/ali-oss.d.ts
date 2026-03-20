declare module 'ali-oss' {
  interface OSSOptions {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
  }

  interface PutObjectResult {
    name: string;
    url: string;
    res: any;
  }

  interface PutObjectOptions {
    mime?: string;
  }

  class OSSClient {
    constructor(options: OSSOptions);
    put(key: string, data: Buffer, options?: PutObjectOptions): Promise<PutObjectResult>;
    delete(key: string): Promise<any>;
    head(key: string): Promise<any>;
    signatureUrl(key: string, options?: { expires?: number }): string;
  }

  export = OSSClient;
}
