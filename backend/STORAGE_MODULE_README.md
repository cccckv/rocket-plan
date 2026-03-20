# Storage Module 文档

## 概述

存储模块为 Rocket Plan 提供统一的文件存储接口，支持多种存储后端：
- **本地文件系统**（开发环境）
- **AWS S3**（生产环境推荐）
- **阿里云 OSS**（中国区域推荐）

## 特性

✅ **多存储后端支持**
- 通过环境变量切换存储提供商
- 统一 API 接口，无需修改业务代码

✅ **完整功能**
- 文件上传（支持图片、视频、音频）
- 文件下载（签名 URL）
- 文件删除
- 文件存在性检查
- 公共 URL 生成

✅ **开发友好**
- 本地文件系统模拟（无需云服务配置）
- 自动创建上传目录
- 静态文件服务（通过 `/uploads` 路径访问）

✅ **安全性**
- JWT 认证保护所有上传端点
- 文件类型验证
- 文件夹隔离（materials/videos/bgm/templates）
- UUID 文件名（防止覆盖和猜测）

## 架构

### 模块结构
```
src/storage/
├── storage.module.ts          # 模块定义
├── storage.service.ts         # 主存储服务（S3/OSS）
├── local-storage.service.ts   # 本地存储服务
├── storage.controller.ts      # REST API 端点
└── ali-oss.d.ts               # 阿里云 OSS 类型定义
```

### 存储提供商选择流程
```typescript
if (STORAGE_PROVIDER === 'local') {
  // 本地文件系统
  // 文件保存到: ./uploads/{folder}/{uuid}.{ext}
  // URL: http://localhost:3000/uploads/{folder}/{uuid}.{ext}
} else if (STORAGE_PROVIDER === 's3') {
  // AWS S3
  // Key: {folder}/{uuid}.{ext}
  // URL: https://{bucket}.s3.{region}.amazonaws.com/{key}
} else if (STORAGE_PROVIDER === 'oss') {
  // 阿里云 OSS
  // Key: {folder}/{uuid}.{ext}
  // URL: https://{bucket}.{region}.aliyuncs.com/{key}
}
```

## API 端点

所有端点需要 JWT 认证（Bearer Token）。

### 1. 上传文件

**POST** `/storage/upload/:folder`

**参数：**
- `folder` - 文件夹类型（materials/videos/bgm/templates）
- `file` - multipart/form-data 文件

**示例请求：**
```bash
curl -X POST http://localhost:3000/storage/upload/materials \
  -H "Authorization: Bearer {accessToken}" \
  -F "file=@/path/to/image.jpg"
```

**响应：**
```json
{
  "message": "File uploaded successfully",
  "key": "materials/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
  "url": "http://localhost:3000/uploads/materials/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
  "bucket": "local",
  "size": 1024000
}
```

### 2. 获取签名 URL

**GET** `/storage/signed-url/:key`

**查询参数：**
- `expiresIn` - URL 有效期（秒，默认 3600）

**示例请求：**
```bash
curl -X GET "http://localhost:3000/storage/signed-url/materials/abc123.jpg?expiresIn=7200" \
  -H "Authorization: Bearer {accessToken}"
```

**响应：**
```json
{
  "url": "https://bucket.s3.region.amazonaws.com/materials/abc123.jpg?...",
  "expiresIn": 7200
}
```

### 3. 删除文件

**DELETE** `/storage/:key`

**示例请求：**
```bash
curl -X DELETE http://localhost:3000/storage/materials/abc123.jpg \
  -H "Authorization: Bearer {accessToken}"
```

**响应：**
```json
{
  "message": "File deleted successfully",
  "key": "materials/abc123.jpg"
}
```

### 4. 检查文件是否存在

**GET** `/storage/exists/:key`

**示例请求：**
```bash
curl -X GET http://localhost:3000/storage/exists/materials/abc123.jpg \
  -H "Authorization: Bearer {accessToken}"
```

**响应：**
```json
{
  "exists": true,
  "key": "materials/abc123.jpg"
}
```

### 5. 获取公共 URL

**GET** `/storage/public-url/:key`

**示例请求：**
```bash
curl -X GET http://localhost:3000/storage/public-url/materials/abc123.jpg \
  -H "Authorization: Bearer {accessToken}"
```

**响应：**
```json
{
  "url": "http://localhost:3000/uploads/materials/abc123.jpg",
  "key": "materials/abc123.jpg"
}
```

## 环境变量配置

### 本地存储（开发环境 - 默认）

```env
STORAGE_PROVIDER="local"
```

无需其他配置。文件自动保存到 `./uploads` 目录。

### AWS S3（生产环境推荐）

```env
STORAGE_PROVIDER="s3"
AWS_ACCESS_KEY_ID="AKIAXXXXXXXXXXXXXXXX"
AWS_SECRET_ACCESS_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
AWS_REGION="ap-southeast-1"
AWS_S3_BUCKET="rocket-plan-production"
```

**S3 桶配置要求：**
1. 创建 S3 桶（推荐区域：ap-southeast-1 新加坡）
2. 配置 CORS（允许前端上传）：
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["http://localhost:3001", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```
3. 配置公共读取权限（可选，推荐使用签名 URL）
4. 创建 IAM 用户并授予 `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` 权限

### 阿里云 OSS（中国区域推荐）

```env
STORAGE_PROVIDER="oss"
OSS_ACCESS_KEY_ID="LTAI5xxxxxxxxxxxxxxxxx"
OSS_ACCESS_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
OSS_REGION="oss-cn-shanghai"
OSS_BUCKET="rocket-plan-production"
```

**OSS 桶配置要求：**
1. 创建 OSS 桶（推荐区域：oss-cn-shanghai 上海）
2. 配置 CORS（跨域资源共享）：
```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>http://localhost:3001</AllowedOrigin>
    <AllowedOrigin>https://yourdomain.com</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedMethod>DELETE</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <MaxAgeSeconds>3000</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>
```
3. 配置读写权限（推荐私有读，通过签名 URL 访问）
4. 创建 RAM 用户并授予 OSS 读写权限

## 使用示例

### 在业务模块中使用 StorageService

```typescript
import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaterialsService {
  constructor(
    private storageService: StorageService,
    private prisma: PrismaService,
  ) {}

  async uploadMaterial(userId: number, file: Express.Multer.File) {
    // 上传文件到存储
    const uploadResult = await this.storageService.upload(file, 'materials');

    // 保存到数据库
    const material = await this.prisma.material.create({
      data: {
        userId,
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        s3Url: uploadResult.url,
        s3Key: uploadResult.key,
        size: uploadResult.size,
        duration: null, // 视频需要额外处理获取时长
      },
    });

    return material;
  }

  async deleteMaterial(materialId: number, userId: number) {
    const material = await this.prisma.material.findFirst({
      where: { id: materialId, userId },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // 从存储删除
    await this.storageService.delete(material.s3Key);

    // 从数据库删除
    await this.prisma.material.delete({
      where: { id: materialId },
    });

    return { message: 'Material deleted successfully' };
  }

  async getMaterialUrl(materialId: number, userId: number) {
    const material = await this.prisma.material.findFirst({
      where: { id: materialId, userId },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // 生成签名 URL（1 小时有效）
    const url = await this.storageService.getSignedUrl(material.s3Key, 3600);

    return { url };
  }
}
```

### 前端上传文件示例

```typescript
// React/Next.js 示例
async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('accessToken');

  const response = await axios.post(
    'http://localhost:3000/storage/upload/materials',
    formData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  console.log('Uploaded:', response.data);
  // {
  //   message: "File uploaded successfully",
  //   key: "materials/...",
  //   url: "http://localhost:3000/uploads/materials/...",
  //   bucket: "local",
  //   size: 1024000
  // }
}
```

## 文件夹规范

| 文件夹 | 用途 | 文件类型 |
|--------|------|----------|
| `materials` | 用户上传的素材 | 图片（JPG, PNG）、视频（MP4, MOV） |
| `videos` | AI 生成的视频 | 视频（MP4） |
| `bgm` | 背景音乐文件 | 音频（MP3, WAV） |
| `templates` | 视频模板缩略图 | 图片（JPG, PNG） |

## 性能优化建议

### 1. CDN 加速（生产环境）
- AWS S3 → CloudFront
- 阿里云 OSS → CDN

配置 CDN 后，更新 `getPublicUrl` 方法返回 CDN 域名。

### 2. 预签名 URL 缓存
对于相同文件，可以缓存签名 URL（Redis）避免重复生成。

```typescript
async getCachedSignedUrl(key: string): Promise<string> {
  const cacheKey = `signed-url:${key}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return cached;
  }

  const url = await this.storageService.getSignedUrl(key, 3600);
  await redis.setex(cacheKey, 3000, url); // 缓存 50 分钟
  
  return url;
}
```

### 3. 文件大小限制
在 `storage.controller.ts` 中添加：

```typescript
@Post('upload/:folder')
@UseInterceptors(
  FileInterceptor('file', {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100 MB
    },
  })
)
```

### 4. 文件类型验证
```typescript
const allowedMimeTypes = {
  materials: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
  ],
  bgm: ['audio/mpeg', 'audio/wav'],
  videos: ['video/mp4'],
  templates: ['image/jpeg', 'image/png'],
};

if (!allowedMimeTypes[folder].includes(file.mimetype)) {
  throw new BadRequestException('Invalid file type');
}
```

## 成本估算

### AWS S3 成本（ap-southeast-1 新加坡）
- 存储：$0.025/GB/月
- PUT 请求：$0.005/1000 请求
- GET 请求：$0.0004/1000 请求
- 数据传出：$0.12/GB（前 10 TB）

**示例：**
- 1000 个用户，每人 10 个视频，每个 50 MB
- 存储：500 GB × $0.025 = **$12.5/月**
- 传输：假设每月 2 TB 下载 = **$240/月**

### 阿里云 OSS 成本（华东 2 上海）
- 存储：¥0.12/GB/月
- PUT 请求：¥0.01/万次
- GET 请求：¥0.01/万次
- 数据传出：¥0.50/GB（前 10 TB）

**示例：**
- 1000 个用户，每人 10 个视频，每个 50 MB
- 存储：500 GB × ¥0.12 = **¥60/月**
- 传输：假设每月 2 TB 下载 = **¥1000/月**

**建议：** 使用 CDN 可大幅降低传输成本（约 30%-50%）。

## 故障排查

### 1. 本地存储文件无法访问
**现象：** 访问 `/uploads/...` 返回 404

**解决：**
- 确认 `main.ts` 中已配置静态文件服务：
```typescript
app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  prefix: '/uploads/',
});
```
- 检查 `uploads` 目录是否存在
- 检查文件权限

### 2. S3 上传失败
**现象：** `AccessDenied` 或 `NoSuchBucket`

**解决：**
- 验证 IAM 用户权限（需要 `s3:PutObject`）
- 验证桶名称和区域配置
- 检查桶是否存在

### 3. OSS 上传失败
**现象：** `AccessDenied` 或 `InvalidAccessKeyId`

**解决：**
- 验证 AccessKey ID 和 Secret
- 验证 RAM 用户权限
- 检查区域配置（必须包含 `oss-` 前缀）

### 4. CORS 错误（前端上传）
**现象：** 浏览器控制台显示 CORS 错误

**解决：**
- 配置 S3/OSS 桶的 CORS 规则
- 确认 `AllowedOrigins` 包含前端域名
- 检查 `main.ts` 中的 CORS 配置

## 下一步

1. **集成到 Materials 模块**
   - 创建 `materials.service.ts` 使用 `StorageService`
   - 实现素材上传、列表、删除功能

2. **添加文件处理**
   - 图片：缩略图生成、尺寸调整
   - 视频：获取时长、生成封面

3. **实现直传（生产优化）**
   - 前端直接上传到 S3/OSS（绕过后端）
   - 后端生成预签名上传 URL
   - 减少服务器带宽消耗

4. **监控和日志**
   - 上传失败率
   - 存储空间使用量
   - 流量消耗

## License

Private - Rocket Plan Project
