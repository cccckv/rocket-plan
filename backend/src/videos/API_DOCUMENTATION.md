# AI 视频生成 API 文档

## 概述

本模块提供基于 Google Veo 模型的 AI 视频生成服务，支持三种生成模式：
- **Text-to-Video (T2V)**: 文本描述生成视频
- **Image-to-Video (I2V)**: 图片 + 文本生成视频
- **Video-to-Video (V2V)**: 视频编辑和风格转换

## API 端点

### 1. 创建视频生成任务

**POST** `/api/videos/generate`

创建一个新的 AI 视频生成任务（异步处理）。

#### 请求头
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### 请求体

##### 文生视频 (Text-to-Video)
```json
{
  "type": "text-to-video",
  "model": "google/veo-3.0-fast",
  "prompt": "A cat playing with a ball in a sunny garden",
  "duration": 8,
  "aspectRatio": "16:9",
  "resolution": "720P",
  "enhancePrompt": true,
  "generateAudio": true
}
```

##### 图生视频 (Image-to-Video)
```json
{
  "type": "image-to-video",
  "model": "google/veo-3.0-i2v-fast",
  "prompt": "The scene comes alive with natural motion",
  "imageUrl": "https://example.com/image.jpg",
  "duration": 8,
  "aspectRatio": "16:9",
  "resolution": "720P"
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 生成类型：text-to-video / image-to-video / video-to-video |
| model | string | 是 | AI 模型名称（见下方模型列表） |
| prompt | string | 是 | 视频描述提示词 |
| imageUrl | string | 条件 | 图片 URL（I2V 必填） |
| videoUrl | string | 条件 | 视频 URL（V2V 必填） |
| duration | number | 否 | 视频时长（4-8秒），默认 8 |
| aspectRatio | string | 否 | 宽高比：16:9 / 9:16，默认 16:9 |
| resolution | string | 否 | 分辨率：720P / 1080P，默认 720P |
| negativePrompt | string | 否 | 负面提示词（要避免的元素） |
| seed | number | 否 | 随机种子（相同种子生成相似结果） |
| enhancePrompt | boolean | 否 | 是否增强提示词，默认 true |
| generateAudio | boolean | 否 | 是否生成音频，默认 true |

#### 响应示例
```json
{
  "id": "uuid-string",
  "userId": 1,
  "type": "text-to-video",
  "model": "google/veo-3.0-fast",
  "prompt": "A cat playing with a ball...",
  "status": "pending",
  "createdAt": "2026-03-29T14:30:00.000Z",
  "updatedAt": "2026-03-29T14:30:00.000Z"
}
```

---

### 2. 查询任务详情

**GET** `/api/videos/tasks/:id`

获取指定任务的详细信息。

#### 响应示例
```json
{
  "id": "uuid-string",
  "userId": 1,
  "type": "text-to-video",
  "model": "google/veo-3.0-fast",
  "prompt": "A cat playing...",
  "status": "completed",
  "resultUrl": "https://cdn.aimlapi.com/video.mp4",
  "localPath": "/uploads/ai-videos/uuid.mp4",
  "duration": 8,
  "metadata": "{\"resolution\":\"720P\",\"aspectRatio\":\"16:9\"}",
  "createdAt": "2026-03-29T14:30:00.000Z",
  "updatedAt": "2026-03-29T14:32:00.000Z"
}
```

---

### 3. 轮询任务状态

**POST** `/api/videos/tasks/:id/poll`

主动触发状态查询，从 AI API 获取最新状态。

#### 响应
与"查询任务详情"相同，但会实时从 AI API 拉取最新状态。

---

### 4. 获取任务列表

**GET** `/api/videos/tasks?limit=20&offset=0`

分页查询当前用户的所有视频生成任务。

#### 查询参数
- `limit`: 每页数量，默认 20
- `offset`: 偏移量，默认 0

#### 响应示例
```json
{
  "tasks": [
    {
      "id": "uuid-1",
      "type": "text-to-video",
      "status": "completed",
      "createdAt": "2026-03-29T14:30:00.000Z"
    },
    {
      "id": "uuid-2",
      "type": "image-to-video",
      "status": "generating",
      "createdAt": "2026-03-29T14:25:00.000Z"
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

---

### 5. 删除任务

**DELETE** `/api/videos/tasks/:id`

删除指定的视频生成任务及其本地文件。

#### 响应
```json
{
  "success": true
}
```

---

## 支持的模型

### Veo 3.x 系列

| 模型名称 | 说明 | 生成时间 | 适用场景 |
|---------|------|---------|---------|
| `google/veo3` | Veo 3 标准版 | ~2分钟 | 高质量文生视频 |
| `google/veo-3.0-fast` | Veo 3 快速版 | ~30-60秒 | 快速文生视频 |
| `google/veo-3.0-i2v` | Veo 3 图生视频 | ~2分钟 | 高质量图生视频 |
| `google/veo-3.0-i2v-fast` | Veo 3 快速图生视频 | ~30-60秒 | 快速图生视频 |

### Veo 2.x 系列

| 模型名称 | 说明 | 生成时间 | 适用场景 |
|---------|------|---------|---------|
| `veo2` | Veo 2 标准版 | ~40-50秒 | 文生视频 |
| `veo2/image-to-video` | Veo 2 图生视频 | ~40-50秒 | 图生视频 |

---

## 任务状态说明

| 状态 | 说明 |
|------|------|
| `pending` | 任务已创建，等待发送到 AI API |
| `queued` | 已提交到 AI API，排队中 |
| `generating` | AI 正在生成视频 |
| `completed` | 生成完成，视频已下载到本地 |
| `failed` | 生成失败，查看 errorMsg 字段 |

---

## 使用流程

1. **创建任务**: 调用 `POST /api/videos/generate`，获得任务 ID
2. **轮询状态**: 定时调用 `POST /api/videos/tasks/:id/poll` 查询进度
   - 建议每 5-10 秒轮询一次
   - 快速模型约 30-60 秒完成
   - 标准模型约 1-2 分钟完成
3. **获取结果**: 当 `status` 变为 `completed` 时，从 `resultUrl` 或 `localPath` 获取视频

---

## 错误处理

### 常见错误

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "imageUrl is required for image-to-video type",
  "error": "Bad Request"
}
```

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Task uuid-string not found or access denied",
  "error": "Not Found"
}
```

#### AI API 错误
任务会标记为 `failed`，错误信息存储在 `errorMsg` 字段。

---

## 代码示例

### JavaScript/TypeScript (axios)

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:3002';
const token = 'your-jwt-token';

async function generateVideo() {
  const response = await axios.post(
    `${API_BASE}/api/videos/generate`,
    {
      type: 'text-to-video',
      model: 'google/veo-3.0-fast',
      prompt: 'A beautiful sunset over the ocean',
      duration: 8,
      aspectRatio: '16:9',
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const taskId = response.data.id;
  console.log('Task created:', taskId);

  while (true) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusRes = await axios.post(
      `${API_BASE}/api/videos/tasks/${taskId}/poll`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    console.log('Status:', statusRes.data.status);

    if (statusRes.data.status === 'completed') {
      console.log('Video URL:', statusRes.data.resultUrl);
      console.log('Local path:', statusRes.data.localPath);
      break;
    } else if (statusRes.data.status === 'failed') {
      console.error('Failed:', statusRes.data.errorMsg);
      break;
    }
  }
}

generateVideo();
```

### cURL

```bash
# 1. 创建任务
curl -X POST http://localhost:3002/api/videos/generate \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text-to-video",
    "model": "google/veo-3.0-fast",
    "prompt": "A cat playing with a ball",
    "duration": 8
  }'

# 2. 轮询状态
curl -X POST http://localhost:3002/api/videos/tasks/{task-id}/poll \
  -H "Authorization: Bearer your-jwt-token"

# 3. 获取任务列表
curl -X GET "http://localhost:3002/api/videos/tasks?limit=10&offset=0" \
  -H "Authorization: Bearer your-jwt-token"
```

---

## 性能和配额

- **生成时间**: 
  - Fast 模型: 30-60 秒
  - 标准模型: 1-2 分钟
- **视频时长**: 4-8 秒
- **最大并发**: 取决于 AI API 配额
- **本地存储**: 视频保存在 `backend/uploads/ai-videos/`

---

## 环境配置

需要在 `.env` 中配置：

```env
AIAPIKEY_API_KEY=sk-your-api-key-here
AIAPIKEY_BASE_URL=https://api.aimlapi.com
```

---

## 架构说明

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Client    │─────>│   NestJS     │─────>│  AI API     │
│  (Frontend) │      │   Backend    │      │ (aiapikey)  │
└─────────────┘      └──────────────┘      └─────────────┘
                             │
                             ↓
                     ┌──────────────┐
                     │   SQLite DB  │
                     │  (VideoTask) │
                     └──────────────┘
                             │
                             ↓
                     ┌──────────────┐
                     │ Local Storage│
                     │ (ai-videos/) │
                     └──────────────┘
```

**处理流程**:
1. 用户提交生成请求
2. 后端创建 VideoTask 记录（status: pending）
3. 异步调用 AI API 创建生成任务（status: queued）
4. 前端定时轮询任务状态
5. 后端查询 AI API 获取最新状态
6. 生成完成后，后台下载视频到本地
7. 用户可通过 resultUrl 或 localPath 访问视频

---

## 注意事项

1. **认证**: 所有接口都需要 JWT Token
2. **权限**: 用户只能访问自己创建的任务
3. **存储**: 视频文件会自动下载到本地服务器
4. **清理**: 删除任务时会同时删除本地文件
5. **超时**: AI 生成超时设置为 10 分钟
6. **轮询**: 建议前端每 5 秒轮询一次状态
