# AI 视频生成 API 快速参考

## 🚀 快速开始

### 服务地址
- **后端 API**: http://localhost:3002
- **Swagger 文档**: http://localhost:3002/api-docs
- **API JSON**: http://localhost:3002/api-docs-json

### 认证
所有接口需要 JWT Token：
```bash
Authorization: Bearer <your_jwt_token>
```

---

## 📡 API 端点速查

### 1. 创建视频任务
```http
POST /api/videos/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "text-to-video",
  "model": "google/veo-3.0-fast",
  "prompt": "Your prompt here",
  "duration": 8,
  "aspectRatio": "16:9",
  "resolution": "720P"
}
```

### 2. 轮询任务状态
```http
POST /api/videos/tasks/:id/poll
Authorization: Bearer <token>
```

### 3. 获取任务详情
```http
GET /api/videos/tasks/:id
Authorization: Bearer <token>
```

### 4. 获取任务列表
```http
GET /api/videos/tasks?limit=20&offset=0
Authorization: Bearer <token>
```

### 5. 删除任务
```http
DELETE /api/videos/tasks/:id
Authorization: Bearer <token>
```

---

## 🎬 支持的模型

### 快速模型（推荐）
- `google/veo-3.0-fast` - Veo 3 快速版（30-60秒）
- `google/veo-3.0-i2v-fast` - Veo 3 快速图生视频

### 标准模型
- `google/veo3` - Veo 3 标准版（1-2分钟）
- `google/veo-3.0-i2v` - Veo 3 图生视频
- `veo2` - Veo 2 标准版
- `veo2/image-to-video` - Veo 2 图生视频

---

## 🔧 参数说明

| 参数 | 类型 | 必填 | 可选值 | 说明 |
|------|------|------|--------|------|
| type | string | ✅ | text-to-video, image-to-video, video-to-video | 生成类型 |
| model | string | ✅ | 见上方模型列表 | AI 模型 |
| prompt | string | ✅ | - | 视频描述 |
| imageUrl | string | ⚠️ | - | 图片URL（I2V必填） |
| videoUrl | string | ⚠️ | - | 视频URL（V2V必填） |
| duration | number | ❌ | 4-8 | 视频时长（秒） |
| aspectRatio | string | ❌ | 16:9, 9:16 | 宽高比 |
| resolution | string | ❌ | 720P, 1080P | 分辨率 |
| negativePrompt | string | ❌ | - | 负面提示词 |
| seed | number | ❌ | - | 随机种子 |
| enhancePrompt | boolean | ❌ | - | 增强提示词 |
| generateAudio | boolean | ❌ | - | 生成音频 |

---

## 📊 任务状态

| 状态 | 说明 |
|------|------|
| `pending` | 任务已创建，等待处理 |
| `queued` | 已提交到 AI API，排队中 |
| `generating` | AI 正在生成视频 |
| `completed` | ✅ 生成完成 |
| `failed` | ❌ 生成失败 |

---

## 💡 使用示例

### 文生视频（Text-to-Video）
```json
{
  "type": "text-to-video",
  "model": "google/veo-3.0-fast",
  "prompt": "A cat playing with a ball in a sunny garden",
  "duration": 8,
  "aspectRatio": "16:9",
  "resolution": "720P"
}
```

### 图生视频（Image-to-Video）
```json
{
  "type": "image-to-video",
  "model": "google/veo-3.0-i2v-fast",
  "prompt": "The scene comes alive with motion",
  "imageUrl": "https://example.com/image.jpg",
  "duration": 8
}
```

---

## ⏱️ 性能参考

- **快速模型**: 30-60 秒
- **标准模型**: 1-2 分钟
- **轮询间隔**: 建议 5-10 秒

---

## 🔐 环境配置

```env
AIAPIKEY_API_KEY=sk-L2rvHGMfzRjnvD2zD2yKfapiexUgxBWgAsNpbryMERtlY0BX
AIAPIKEY_BASE_URL=https://api.aimlapi.com
```

---

## 📁 文件位置

- **上传目录**: `backend/uploads/ai-videos/`
- **API 文档**: `backend/src/videos/API_DOCUMENTATION.md`
- **代码位置**: `backend/src/videos/`

---

## 🧪 快速测试

```bash
# 启动服务
cd /root/ccccckv/rocket-plan/backend
npm run start:dev

# 运行测试
./test-ai-video-simple.sh

# 查看 Swagger
open http://localhost:3002/api-docs
```

---

## ❓ 常见问题

### Q: 如何获取 JWT Token？
A: 调用 `/auth/login` 接口登录获取

### Q: 视频生成失败怎么办？
A: 检查 `errorMsg` 字段，可能是 API Key 无效或网络问题

### Q: 如何查看生成进度？
A: 定时调用 `/api/videos/tasks/:id/poll` 轮询状态

### Q: 视频文件存储在哪里？
A: 查看 `localPath` 字段，默认在 `uploads/ai-videos/`

---

**更新日期**: 2026-03-29  
**版本**: v1.0  
**完整文档**: `AI_VIDEO_IMPLEMENTATION_SUMMARY.md`
