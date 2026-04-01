# 积分系统快速参考

## 快速开始

### 启动服务
```bash
cd backend
npm run build
npm run start:dev
```

### 测试系统
```bash
ts-node test-credit-system.ts
```

---

## API速查

### 1. 查余额
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3002/api/credits/balance
```
响应: `{"credits": 10, "tier": "free"}`

### 2. 查历史
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3002/api/credits/transactions?limit=20
```

### 3. 查定价
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3002/api/credits/costs
```

### 4. 生成视频（自动扣费）
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type":"text-to-video","model":"veo3.1-fast-components","prompt":"test"}' \
  http://localhost:3002/api/videos/generate
```

---

## 积分定价速查表

| 模型 | 积分 | 适用场景 |
|-----|------|---------|
| veo3.1-fast-components | 1 | 快速测试 |
| veo_3_1-fast | 2 | 标准快速 |
| veo3.1 | 3 | 标准质量 |
| veo_3_1-4K | 4 | 高清4K |
| veo3.1-pro | 10 | 专业版 |
| veo3.1-pro-4k | 15 | 专业4K |

完整列表: 20个模型，1-15积分

---

## 核心流程

### 视频生成流程
```
请求 → 查成本 → 检查余额 → 扣积分 → 调AI API → 返回任务
          ↓ 不足          ↓ 成功    ↓ 失败
        拒绝           记录      退积分
```

### 扣费时机
- ✅ 创建任务时立即扣除
- ✅ 生成失败自动退还
- ✅ 所有操作有Transaction记录

---

## 常见错误

### 余额不足
```json
{
  "statusCode": 400,
  "message": "Insufficient credits. Required: 3, Available: 1"
}
```
**解决**: 用户需要充值（未实现）或使用更便宜的模型

### 用户不存在
```json
{
  "statusCode": 404,
  "message": "User not found"
}
```
**解决**: 检查token是否有效

---

## 数据库查询

### 查用户余额
```sql
SELECT id, email, credits, tier FROM User WHERE id = 1;
```

### 查交易记录
```sql
SELECT * FROM Transaction 
WHERE userId = 1 
ORDER BY createdAt DESC 
LIMIT 10;
```

### 查某个视频任务的扣费
```sql
SELECT * FROM Transaction 
WHERE videoId = 'abc-123' AND type = 'consume';
```

---

## 自定义定价

### 方法1: 环境变量
```bash
# .env
CREDIT_COSTS='{"veo3.1-fast-components":1,"veo3.1":3,"veo3.1-pro":10}'
```

### 方法2: 修改代码
编辑 `src/credits/credits.service.ts` 的 `loadCreditCosts()` 方法

---

## 监控命令

### 查看扣费日志
```bash
grep "Deducted" backend.log | tail -20
```

### 查看退款日志
```bash
grep "Refunded" backend.log | tail -20
```

### 统计今日消费
```sql
SELECT SUM(amount) as total_consumed
FROM Transaction
WHERE type = 'consume' 
  AND DATE(createdAt) = DATE('now');
```

---

## 故障排查

### 问题: 积分没扣除
1. 检查 `VideosModule` 是否导入 `CreditsModule`
2. 查看日志: `grep "Credits deducted" backend.log`
3. 检查数据库: `SELECT * FROM Transaction ORDER BY id DESC LIMIT 5;`

### 问题: 失败没退款
1. 查看错误日志: `grep "Failed to initiate" backend.log`
2. 检查退款日志: `grep "Refunded" backend.log`
3. 手动退款: 调用 `creditsService.refundCredits()`

### 问题: 定价不对
1. 查看启动日志确认加载的成本数量
2. 访问 `/api/credits/costs` 验证定价
3. 检查 `.env` 中 `CREDIT_COSTS` 格式

---

## 文件位置

### 核心代码
- `src/credits/credits.service.ts` - 业务逻辑
- `src/credits/credits.controller.ts` - API接口
- `src/videos/videos.service.ts` - 扣费集成

### 文档
- `CREDIT_SYSTEM.md` - 完整文档
- `CREDIT_SYSTEM_SUMMARY.md` - 实现总结
- `CREDIT_QUICK_REFERENCE.md` - 本文件

### 测试
- `test-credit-system.ts` - 功能测试

---

## 关键配置

### 默认值
- 新用户初始积分: 2
- 默认用户等级: free
- 未定义模型默认成本: 3 credits
- Transaction分页默认: 20条/页

### 环境变量
```bash
DATABASE_URL="file:./dev.db"
CREDIT_COSTS='...'  # 可选，覆盖默认定价
```

---

## 常用代码片段

### 手动调整积分（管理员）
```typescript
await creditsService.addCredits(
  userId,
  10,
  'admin_adjust',
  'Manual adjustment by admin'
);
```

### 检查余额
```typescript
const hasEnough = await creditsService.checkBalance(userId, 5);
if (!hasEnough) {
  throw new BadRequestException('Insufficient credits');
}
```

### 查询交易历史
```typescript
const history = await creditsService.getTransactionHistory(userId, 20, 0);
```

---

## 性能提示

- ✅ 积分成本缓存在内存（Map）
- ✅ Transaction表按userId索引
- ✅ 数据库事务最小化锁范围
- ✅ 查询历史支持分页

---

## 安全提示

- ✅ 所有接口需JWT认证
- ✅ 用户只能查自己的数据
- ✅ 数据库事务保证原子性
- ✅ Transaction记录不可删除
- ✅ 所有操作有审计日志

---

## 下一步

### 立即可做
- [ ] 运行测试脚本验证功能
- [ ] 查看Swagger文档: http://localhost:3002/api-docs
- [ ] 监控Transaction表增长

### 未来扩展
- [ ] 实现充值接口
- [ ] 添加管理后台
- [ ] 设计充值套餐
- [ ] 会员等级权益

---

**完整文档**: 查看 `CREDIT_SYSTEM.md`
