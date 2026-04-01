# 积分系统实现文档

## 概述

本系统实现了完整的积分管理功能，包括积分扣费、退款、交易记录和历史查询。所有视频生成操作都会自动扣除相应积分。

## 功能特性

### ✅ 已实现
1. **积分余额检查** - 生成视频前验证用户积分
2. **自动积分扣费** - 创建视频任务时自动扣除积分
3. **失败自动退款** - 视频生成失败时自动退还积分
4. **交易记录** - 所有积分变动都有完整记录
5. **历史查询** - 用户可查询积分交易历史
6. **多模型定价** - 不同AI模型有不同积分成本
7. **数据库事务** - 确保积分操作的原子性

### ❌ 未实现
- 积分充值接口（按要求暂不实现）
- 支付集成（需要时再添加）

## 架构设计

### 模块结构
```
backend/src/credits/
├── credits.module.ts          # 积分模块
├── credits.service.ts         # 积分业务逻辑
├── credits.controller.ts      # API接口
└── dto/
    ├── credit-transaction.dto.ts  # 交易记录DTO
    └── index.ts
```

### 核心服务

#### CreditsService

**主要方法**:
- `getCreditCost(model: string)` - 获取模型的积分成本
- `checkBalance(userId, amount)` - 检查余额是否足够
- `getBalance(userId)` - 获取用户当前余额
- `deductCredits(userId, amount, reason, videoId?)` - 扣除积分
- `refundCredits(userId, amount, videoId, reason)` - 退还积分
- `getTransactionHistory(userId, limit, offset)` - 查询交易历史

**特点**:
- 使用 Prisma 事务确保原子性
- 所有积分变动都创建 Transaction 记录
- 详细的日志记录用于审计

## 积分定价

### 默认定价表

基于 aiapikey.ai 的实际价格（¥0.260 - ¥4.000），按成本梯度设置积分：

| 模型分类 | 积分成本 | 模型示例 |
|---------|---------|---------|
| 低成本快速模型 | 1 credit | veo3.1-fast-components |
| 快速模型 | 2 credits | veo_3_1-fast, veo3.1-fast |
| 标准质量 | 3 credits | veo3.1, veo3 |
| 4K模型 | 4 credits | veo_3_1-4K, veo3.1-4k |
| 帧模型 | 5 credits | veo3-fast-frames |
| Pro帧模型 | 8 credits | veo3-pro-frames |
| Pro模型 | 10 credits | veo3.1-pro |
| Pro 4K | 15 credits | veo3.1-pro-4k |

### 自定义定价

在 `.env` 中添加 `CREDIT_COSTS` 环境变量覆盖默认定价：

```bash
CREDIT_COSTS='{"veo3.1-fast-components":1,"veo_3_1-fast":2,"veo3.1":3,"veo3.1-pro":10}'
```

## API 接口

### 1. 查询积分余额

**请求**:
```bash
GET /api/credits/balance
Authorization: Bearer <token>
```

**响应**:
```json
{
  "credits": 10,
  "tier": "free"
}
```

### 2. 查询交易历史

**请求**:
```bash
GET /api/credits/transactions?limit=20&offset=0
Authorization: Bearer <token>
```

**响应**:
```json
{
  "transactions": [
    {
      "id": 1,
      "userId": 1,
      "amount": -1,
      "type": "consume",
      "videoId": "abc-123",
      "createdAt": "2024-03-29T10:00:00Z"
    }
  ],
  "total": 25,
  "limit": 20,
  "offset": 0
}
```

### 3. 查询模型定价

**请求**:
```bash
GET /api/credits/costs
Authorization: Bearer <token>
```

**响应**:
```json
{
  "costs": [
    {"model": "veo3.1-fast-components", "cost": 1},
    {"model": "veo_3_1-fast", "cost": 2},
    {"model": "veo3.1", "cost": 3}
  ]
}
```

## 视频生成流程

### 正常流程

```
用户发起视频生成请求
    ↓
1. 验证输入参数
    ↓
2. 查询模型积分成本
    ↓
3. 检查用户积分余额
    ↓
4. 余额不足 → 返回错误
    ↓
5. 创建 VideoTask 记录
    ↓
6. 扣除积分 + 创建 Transaction 记录
    ↓
7. 调用 AI API 生成视频
    ↓
8. 返回任务信息给用户
```

### 失败退款流程

```
视频生成失败
    ↓
1. 捕获错误
    ↓
2. 查找已扣除的积分金额
    ↓
3. 退还积分给用户
    ↓
4. 创建 Transaction 记录 (type: refund)
    ↓
5. 更新任务状态为 failed
    ↓
6. 记录详细错误日志
```

## 数据库模型

### User
```prisma
model User {
  credits   Int      @default(2)     // 积分余额
  tier      String   @default("free") // 用户等级
  transactions Transaction[]         // 交易记录
}
```

### Transaction
```prisma
model Transaction {
  id        Int      @id @default(autoincrement())
  userId    Int
  amount    Int      // 正数=充值/退款，负数=消费
  type      String   // purchase / consume / refund / admin_adjust
  videoId   Int?     // 关联视频任务
  createdAt DateTime @default(now())
}
```

### VideoTask
```prisma
model VideoTask {
  metadata  String?  // JSON: { creditCost: number, ... }
}
```

## 错误处理

### 余额不足
```json
{
  "statusCode": 400,
  "message": "Insufficient credits. Required: 3, Available: 1",
  "error": "Bad Request"
}
```

### 用户不存在
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

## 安全机制

### 1. 数据库事务
所有积分操作使用 Prisma 事务，确保：
- 余额检查和扣除是原子操作
- 同时创建 Transaction 记录
- 失败时全部回滚

### 2. 并发控制
- 使用数据库锁防止并发扣费
- Transaction 表记录完整审计日志

### 3. 权限验证
- 所有接口需要 JWT 认证
- 用户只能查询自己的交易记录

## 日志记录

系统记录所有关键操作：

```
[CreditsService] Deducted 3 credits from user 1 (user@example.com). 
Reason: Video generation: veo3.1. New balance: 7

[VideosService] Credits deducted for task abc-123. 
Amount: 3, New balance: 7

[CreditsService] Refunded 3 credits to user 1 (user@example.com). 
Type: refund, Reason: Refund for failed video generation. New balance: 10
```

## 测试

### 运行测试脚本

```bash
cd backend
npm run build
npm run start:dev

# 在另一个终端
ts-node test-credit-system.ts
```

### 测试场景

1. ✅ 查询初始余额（2 credits）
2. ✅ 查询模型定价
3. ✅ 生成视频（扣除1 credit）
4. ✅ 验证余额减少（1 credit）
5. ✅ 查询交易历史（有消费记录）
6. ✅ 余额不足时拒绝生成
7. ✅ 生成失败时自动退款

## 配置

### 环境变量

```bash
# .env

# 可选：自定义积分定价（JSON格式）
CREDIT_COSTS='{"veo3.1-fast-components":1,"veo_3_1-fast":2}'
```

### 默认值

- 新用户初始积分：2
- 默认用户等级：free
- 未定义模型默认成本：3 credits

## 扩展指南

### 添加新模型定价

1. 修改 `credits.service.ts` 的 `loadCreditCosts()` 方法
2. 或在 `.env` 中添加到 `CREDIT_COSTS` JSON

### 添加充值功能

1. 创建 `PurchaseCreditsDto`
2. 在 `CreditsController` 添加 `POST /api/credits/purchase`
3. 集成支付网关（微信/支付宝/Stripe）
4. 调用 `creditsService.addCredits(userId, amount, 'purchase', reason)`

### 添加会员等级权益

1. 在 `credits.service.ts` 添加等级检查方法
2. 不同等级设置不同的积分折扣
3. Pro用户可能享受更低的积分成本

## 故障排查

### 积分未扣除
- 检查 `VideosModule` 是否导入 `CreditsModule`
- 查看日志确认 `deductCredits()` 是否被调用
- 检查数据库 Transaction 表是否有记录

### 失败未退款
- 查看 `initiateGeneration()` 错误日志
- 检查是否捕获到异常
- 确认 `refundCredits()` 调用是否成功

### 定价不正确
- 检查 `.env` 中的 `CREDIT_COSTS` 格式
- 查看启动日志确认加载的成本数量
- 使用 `GET /api/credits/costs` 验证实际定价

## 性能优化

- Transaction 表按 userId 索引，查询历史快速
- 使用数据库事务避免不一致
- 积分成本在内存中缓存（Map）

## 安全建议

1. 生产环境使用 HTTPS
2. JWT token 设置合理过期时间
3. 定期审计 Transaction 记录
4. 监控异常的积分变动
5. 备份 Transaction 表防止数据丢失
