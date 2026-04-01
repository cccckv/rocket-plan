# Rocket Plan (CreateOK) 技术架构

## 📋 项目概览

**项目名称**: Rocket Plan (CreateOK)  
**定位**: AI 驱动的 TikTok 短视频批量生产 SaaS 平台  
**目标市场**: 电商卖家（菲律宾 + 中国市场）  
**交付目标**: 4-7 周 MVP

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                Next.js 16 + Ant Design 5                     │
│                    (Port: 3001)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST API
┌──────────────────────┴──────────────────────────────────────┐
│                         Backend                              │
│                    NestJS + Prisma ORM                       │
│                    (Port: 3000)                              │
├──────────────────────────────────────────────────────────────┤
│  Auth Module  │  Videos Module  │  Storage Module            │
│  (✅ 完成)     │  (❌ 空实现)     │  (✅ 完成)                 │
├──────────────────────────────────────────────────────────────┤
│  Materials    │  Scripts Module │  Admin Module              │
│  (❌ 空实现)   │  (❌ 空实现)     │  (❌ 空实现)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                    数据层 & 队列层                           │
├──────────────────────────────────────────────────────────────┤
│  PostgreSQL (生产) / SQLite (开发)  │  Redis + BullMQ        │
│  8 Models (Prisma Schema)           │  (❌ 未配置)            │
└──────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                      外部服务集成                            │
├──────────────────────────────────────────────────────────────┤
│  认证: 阿里云SMS (✅) + Twilio (✅) + Google OAuth (待配置)  │
│  存储: S3 / 阿里云OSS / Local (✅ 多云支持)                  │
│  AI脚本: Gemini 1.5 Flash (❌ 未集成)                        │
│  视频AI: 待定 (AIPaiKey/Runway/Pika) (❌ 未集成)             │
│  TTS: 待定 (推荐 Google Cloud TTS) (❌ 未决定)               │
│  视频渲染: FFmpeg (❌ 未实现)                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 🖥️ 前端技术栈

### 核心框架
- **React 19.2.3** + **Next.js 16.1.7** (App Router)
- **Ant Design 5.29.3** (主 UI 组件库)
- **Radix UI** (底层无样式组件库)
  - Dialog, Dropdown, Popover, Select, Tabs, Tooltip

### 样式 & 动画
- **Tailwind CSS 4** (样式方案)
- **Framer Motion 12.38** (动画库)
- **Lucide React 0.577** (图标库)

### 国际化 & 状态管理
- **next-intl 4.8.3** (i18n 国际化)
- 支持语言: `zh` (中文), `en` (英文), `ja` (日语), `ko` (韩语)
- **clsx + tailwind-merge** (条件样式合并)

### 其他库
- **axios 1.13.6** (HTTP 客户端)
- **react-countup 6.5.3** (数字动画)

### 前端页面实现状态

| 页面路径 | 状态 | 功能说明 |
|---------|------|---------|
| `/` (Landing) | ✅ 完成 | 产品介绍页 (Hero, Features, Stats, FAQ, CTA) |
| `/login` | ✅ 完成 | 登录页 (手机号/邮箱 + Google OAuth) |
| `/register` | ✅ 完成 | 注册页 (手机号验证码/邮箱密码) |
| `/forgot-password` | ✅ 完成 | 忘记密码 (邮箱重置) |
| `/auth/callback` | ✅ 完成 | OAuth 回调处理 |
| `/dashboard` | ⚠️ 60% | 用户仪表盘 (使用模拟数据) |
| `/videos` | ❌ 缺失 | 视频列表页 (导航栏已引用但页面不存在) |
| `/create` | ❌ 缺失 | 视频创建页 (导航栏已引用但页面不存在) |
| `/materials` | ❌ 缺失 | 素材库管理页 (导航栏已引用但页面不存在) |

**i18n 问题**: 约 15 个翻译键缺失 (`signIn`, `email`, `password`, `loading` 等)

---

## 🔧 后端技术栈

### 核心框架
- **NestJS 11.0.1** (企业级 Node.js 框架)
- **Prisma 7.5.0** (ORM + Type-safe 数据库客户端)
- **TypeScript 5.7.3**

### 认证 & 安全
- **Passport.js 0.7.0** + 策略模式
  - `passport-local` (手机号/邮箱密码登录)
  - `passport-jwt` (JWT 令牌认证)
  - `passport-google-oauth20` (Google OAuth)
- **@nestjs/jwt 11.0.2** (JWT 令牌生成)
- **bcrypt 6.0.0** (密码哈希)
- **阿里云 SMS SDK 1.1.6** (中国 +86 手机号验证码)
- **Twilio 5.3.4** (国际手机号验证码)

### 存储 & 文件处理
- **AWS SDK S3 Client 3.1011.0** (S3 对象存储)
- **ali-oss 6.23.0** (阿里云 OSS)
- **multer 2.1.1** (文件上传中间件)
- **@nestjs/platform-express** (Express 适配器)

### 队列 & 缓存
- **BullMQ 5.71.0** (基于 Redis 的任务队列，**未配置**)
- **ioredis 5.10.0** (Redis 客户端)
  - 用途: OTP 存储、速率限制、会话管理

### 邮件 & 通知
- **nodemailer 8.0.3** (邮件发送)

### 数据验证
- **class-validator 0.15.1** (DTO 验证)
- **class-transformer 0.5.1** (类转换)

### 开发环境数据库
- **SQLite** (开发环境)
- **@libsql/client 0.17.0** + **@prisma/adapter-libsql 7.5.0**

---

## 🗄️ 数据库设计 (Prisma Schema)

### 8 个核心模型

#### 1. User (用户表)
```prisma
- id: Int (主键)
- phone: String? (唯一，支持 +86 和国际号码)
- googleId: String? (唯一，Google OAuth ID)
- email: String (唯一)
- password: String? (bcrypt 哈希)
- name: String?
- credits: Int (默认 2，新用户免费视频数)
- tier: String (默认 "free"，可选 "basic"/"pro")
- 关联: videos[], materials[], transactions[]
```

#### 2. Video (生成的视频)
```prisma
- id: Int (主键)
- userId: Int (外键)
- status: String (pending / rendering / completed / failed)
- language: String (zh / en)
- userInput: String (用户填写的卖点)
- templateId: Int? (模板ID)
- bgmId: Int? (背景音乐ID)
- scriptId: Int? (AI生成脚本ID，唯一)
- outputUrl: String? (S3视频URL)
- duration: Int? (视频时长，秒)
- jobId: String? (BullMQ任务ID，**未使用**)
- error: String? (错误信息)
- 关联: materials[] (多对多), script (一对一)
```

#### 3. Script (AI 生成的脚本)
```prisma
- id: Int (主键)
- videoId: Int (外键，唯一)
- hook: String (钩子 - 前 3 秒吸引注意力)
- value: String (卖点 - 产品价值主体)
- cta: String (行动号召 - Call To Action)
- language: String (zh / en)
```

#### 4. Material (用户上传的素材)
```prisma
- id: Int (主键)
- userId: Int (外键)
- type: String (image / video)
- s3Url: String (存储URL)
- s3Key: String (S3对象键)
- size: Int (文件大小，bytes)
- duration: Int? (视频时长，秒)
- 关联: videos[] (多对多)
```

#### 5. VideoMaterial (视频-素材多对多关联表)
```prisma
- videoId: Int (复合主键)
- materialId: Int (复合主键)
- order: Int (素材在视频中的顺序)
```

#### 6. Template (视频模板)
```prisma
- id: Int (主键)
- name: String (模板名称)
- category: String (furniture / electronics / fashion)
- configJson: String (模板配置，JSON字符串)
- thumbnailUrl: String (缩略图URL)
```

#### 7. BGM (背景音乐)
```prisma
- id: Int (主键)
- name: String (音乐名称)
- fileUrl: String (S3 URL)
- s3Key: String (S3对象键)
- duration: Int (时长，秒)
- category: String (upbeat / calm / dramatic)
- license: String (默认 "Pixabay License")
```

#### 8. Transaction (积分交易记录)
```prisma
- id: Int (主键)
- userId: Int (外键)
- amount: Int (正数=充值，负数=消费)
- type: String (purchase / consume / refund)
- videoId: Int? (关联视频ID，消费时使用)
```

### 种子数据 (Seed Data)
- **4 个测试用户** (test@createok.com 拥有 100 积分)
- **7 个 BGM** (Pixabay 授权音乐)
- **7 个模板** (家具/电子产品/时尚类)

---

## 🔐 认证架构

### 关键设计决策
**为什么不用 Firebase Auth?**  
→ 必须支持中国 +86 手机号注册（Firebase 在中国不可用）

### 认证流程

#### 1. 短信验证码登录/注册
```
用户输入手机号 
  → 后端判断号码前缀
     ├─ +86 → 阿里云 SMS API
     └─ 其他 → Twilio SMS API
  → 生成 6 位 OTP，存储到 Redis (5分钟过期)
  → 用户输入验证码
  → 验证通过 → 返回 JWT Access Token + Refresh Token
```

**实现文件**: `backend/src/auth/services/sms.service.ts` (124行，双SMS路由)

#### 2. 邮箱密码登录/注册
```
用户输入邮箱 + 密码
  → bcrypt 哈希校验
  → 生成 JWT tokens
```

#### 3. Google OAuth 2.0
```
用户点击 Google 登录
  → 跳转 Google 授权页
  → 回调到 /auth/google/callback
  → 提取 googleId、email、name
  → 自动创建/关联用户
  → 返回 JWT tokens
```

### JWT 令牌策略
- **Access Token**: 7 天有效期
- **Refresh Token**: 30 天有效期
- **Secret**: 存储在 `.env` (生产环境需更换)

---

## 📦 存储架构 (Storage Module)

### 多云存储支持
**实现文件**: `backend/src/storage/storage.service.ts` (293行)

| 存储提供商 | 用途 | 状态 |
|-----------|------|------|
| **Local** | 开发环境 | ✅ 默认 |
| **AWS S3** | 生产环境 (国际市场) | ✅ 已集成 |
| **阿里云 OSS** | 生产环境 (中国市场) | ✅ 已集成 |

### 功能特性
- 预签名 URL 生成 (临时下载链接)
- 文件上传/删除
- 支持图片、视频、音频
- 环境变量切换存储提供商

---

## 🎬 视频生成流水线 (设计，未实现)

### 预期工作流程
```
1. 用户提交视频创建请求
   ├─ 输入: 产品卖点、选择模板、选择BGM、上传素材
   └─ 扣除 1 积分

2. Gemini 1.5 Flash 生成脚本
   ├─ 输入: 用户卖点 + 模板类型
   └─ 输出: { hook, value, cta }

3. BullMQ 队列处理
   ├─ 创建 Video 记录 (status: pending)
   └─ 添加到 video-generation 队列

4. Worker 进程监听队列
   ├─ 调用 Video AI API (生成视频片段)
   ├─ FFmpeg 渲染合成
   │  ├─ 素材拼接
   │  ├─ 字幕叠加 (hook/value/cta)
   │  ├─ BGM 混音
   │  └─ 贴纸动画
   └─ 输出: 1080×1920 MP4

5. 上传到 S3/OSS
   └─ 更新 Video.status = completed, Video.outputUrl

6. 用户下载视频
```

### 性能目标
- **60 秒内完成视频生成** (从提交到可下载)

### 当前实现状态
| 组件 | 状态 | 缺失内容 |
|------|------|---------|
| Videos Controller | ❌ 空实现 | 5 个端点 (create, list, get, delete, retry) |
| Videos Service | ❌ 空实现 | 积分扣除、队列任务创建逻辑 |
| BullMQ 队列 | ❌ 未配置 | Redis 连接、队列定义、Worker 进程 |
| FFmpeg 集成 | ❌ 未实现 | 模板解析器、滤镜图、字幕叠加 |
| Gemini API | ❌ 未集成 | 脚本生成服务 |
| Video AI API | ❌ 未选型 | AIPaiKey/Runway/Pika 待评估 |
| TTS 集成 | ❌ 未决定 | Google Cloud TTS (推荐) |

---

## 🌐 部署架构

### 开发环境
- **后端**: `http://localhost:3000` (NestJS)
- **前端**: `http://localhost:3001` (Next.js)
- **数据库**: SQLite (`backend/dev.db`, 108KB)
- **Redis**: `localhost:6379`

### 生产环境 (设计)
```
VPS 服务器
├─ Docker Compose
│  ├─ NestJS Backend (容器)
│  ├─ Next.js Frontend (容器)
│  ├─ PostgreSQL (容器)
│  ├─ Redis (容器)
│  └─ BullMQ Worker (容器，独立进程)
└─ Nginx (反向代理)
   ├─ /api → Backend:3000
   └─ / → Frontend:3001
```

**当前状态**: Docker Compose 配置未编写

---

## 🔑 环境变量配置

### ✅ 已配置
- `DATABASE_URL` (SQLite 开发环境)
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `REDIS_HOST`, `REDIS_PORT`
- `STORAGE_PROVIDER=local`
- `FRONTEND_URL=http://localhost:3001`

### ❌ 待配置 (生产必需)
```bash
# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# 阿里云 SMS (中国 +86 号码)
ALIBABA_ACCESS_KEY_ID=""
ALIBABA_ACCESS_KEY_SECRET=""
ALIBABA_SMS_SIGN_NAME=""
ALIBABA_SMS_TEMPLATE_CODE=""

# Twilio SMS (国际号码)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Gemini AI (脚本生成)
GEMINI_API_KEY=""

# Video AI API (视频生成)
VIDEO_AI_API_KEY=""
VIDEO_AI_API_URL=""

# AWS S3 (生产存储)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET="rocket-plan-prod"

# 阿里云 OSS (中国市场存储)
OSS_ACCESS_KEY_ID=""
OSS_ACCESS_KEY_SECRET=""
OSS_BUCKET="rocket-plan-cn"
```

---

## 📊 模块实现进度总结

| 模块 | 后端 | 前端 | 状态 |
|------|------|------|------|
| **认证 (Auth)** | ✅ 100% | ✅ 100% | 完成 (双SMS路由 + OAuth) |
| **存储 (Storage)** | ✅ 100% | N/A | 完成 (多云支持) |
| **用户 (Users)** | ✅ 80% | ⚠️ 60% | 部分完成 (Dashboard 用模拟数据) |
| **视频 (Videos)** | ❌ 0% | ❌ 0% | **P0 阻塞** (核心功能未实现) |
| **素材 (Materials)** | ❌ 0% | ❌ 0% | 未开始 |
| **脚本 (Scripts)** | ❌ 0% | N/A | 未开始 (Gemini 集成缺失) |
| **管理后台 (Admin)** | ❌ 0% | ❌ 0% | 未开始 |

### 关键技术债务
1. **BullMQ 队列未配置** (包已安装但无队列定义)
2. **FFmpeg 渲染引擎未实现** (无模板解析器)
3. **Gemini API 未集成** (脚本生成无法工作)
4. **前端 3 个核心页面缺失** (`/videos`, `/create`, `/materials`)
5. **前端无 API 客户端层** (直接使用 axios 内联调用)

---

## 🎯 下一步优先级 (P0 阻塞任务)

1. **实现 Videos 模块后端**
   - 创建 5 个端点 (create, list, get, delete, retry)
   - 实现积分扣除逻辑
   - BullMQ 队列任务创建

2. **配置 BullMQ + Redis**
   - 定义 `video-generation` 队列
   - 创建 Worker 进程监听队列

3. **集成 FFmpeg 渲染引擎**
   - 安装 `fluent-ffmpeg`
   - 实现模板 JSON → FFmpeg 滤镜图解析器
   - 字幕叠加、贴纸动画、BGM 混音

4. **创建前端缺失页面**
   - `/videos` (视频列表 + 状态筛选)
   - `/create` (视频创建表单)
   - `/materials` (素材库管理)

5. **集成 Gemini API**
   - 实现脚本生成服务 (用户卖点 → Hook/Value/CTA)

---

## 📝 文件结构

```
rocket-plan/
├── backend/
│   ├── src/
│   │   ├── auth/          ✅ 完成 (379行，双SMS路由)
│   │   ├── storage/       ✅ 完成 (293行，多云支持)
│   │   ├── users/         ⚠️ 部分完成
│   │   ├── videos/        ❌ 空实现
│   │   ├── materials/     ❌ 空实现
│   │   ├── scripts/       ❌ 空实现
│   │   ├── admin/         ❌ 空实现
│   │   └── prisma/        ✅ 完成
│   ├── prisma/
│   │   ├── schema.prisma  ✅ 8个模型定义
│   │   └── seed.ts        ✅ 种子数据
│   ├── dev.db            (SQLite 数据库)
│   └── .env              (环境变量)
│
└── frontend/
    ├── app/[locale]/
    │   ├── login/         ✅ 完成
    │   ├── register/      ✅ 完成
    │   ├── dashboard/     ⚠️ 60% (模拟数据)
    │   ├── videos/        ❌ 缺失
    │   ├── create/        ❌ 缺失
    │   └── materials/     ❌ 缺失
    ├── components/        ✅ 20+ UI组件
    └── messages/          ⚠️ 缺失15个翻译键
```

---

**最后更新**: 2026-03-20  
**备份日期**: 2026-03-19 13:35 (rocket-plan-backup-p1)
