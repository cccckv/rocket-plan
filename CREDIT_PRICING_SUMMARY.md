# 积分定价配置总结

## 定价原则

**1 积分 = ¥1**

所有积分消耗直接对应 https://aiapikey.ai/pricing 的实际价格。

## 已更新的配置

### 后端 (Backend)

**文件**: `/root/ccccckv/rocket-plan/backend/src/credits/credits.service.ts`

```typescript
costs.set('veo3.1-fast-components', 0.26);
costs.set('veo_3_1-fast-components', 0.26);
costs.set('veo_3_1-fast', 0.52);
costs.set('veo_3_1-fast-4K', 0.78);
costs.set('veo3.1-fast', 0.52);
costs.set('veo3-fast', 0.52);
costs.set('veo3.1', 1.04);
costs.set('veo_3_1', 1.04);
costs.set('veo3.1-components', 0.78);
costs.set('veo_3_1-components', 0.78);
costs.set('veo3', 1.04);
costs.set('veo_3_1-4K', 1.56);
costs.set('veo_3_1-components-4K', 1.56);
costs.set('veo_3_1-fast-components-4K', 1.04);
costs.set('veo3.1-4k', 1.56);
costs.set('veo3.1-components-4k', 1.56);
costs.set('veo3-fast-frames', 2.08);
costs.set('veo3-frames', 2.60);
costs.set('veo3-pro-frames', 3.64);
costs.set('veo3.1-pro', 5.20);
costs.set('veo3.1-pro-4k', 7.80);
```

**状态**: ✅ 已更新并重启

### 前端 (Frontend)

**文件**: `/root/ccccckv/rocket-plan/frontend/lib/api/credits.ts`

```typescript
export const DEFAULT_CREDIT_COSTS: Record<string, number> = {
  'veo3.1-fast-components': 0.26,
  'veo_3_1-fast-components': 0.26,
  'veo_3_1-fast': 0.52,
  'veo_3_1-fast-4K': 0.78,
  'veo3.1-fast': 0.52,
  'veo3-fast': 0.52,
  'veo3.1': 1.04,
  'veo_3_1': 1.04,
  'veo3.1-components': 0.78,
  'veo_3_1-components': 0.78,
  'veo3': 1.04,
  'veo_3_1-4K': 1.56,
  'veo_3_1-components-4K': 1.56,
  'veo_3_1-fast-components-4K': 1.04,
  'veo3.1-4k': 1.56,
  'veo3.1-components-4k': 1.56,
  'veo3-fast-frames': 2.08,
  'veo3-frames': 2.60,
  'veo3-pro-frames': 3.64,
  'veo3.1-pro': 5.20,
  'veo3.1-pro-4k': 7.80,
};
```

**状态**: ✅ 已更新

### 文档

**文件**: `/root/ccccckv/rocket-plan/VEO_MODELS_REFERENCE.md`

所有模型的积分消耗已更新为小数值，并添加了定价来源说明。

**状态**: ✅ 已更新

## 价格示例

| 模型 | 积分消耗 | CNY价格 | 用途 |
|------|---------|---------|------|
| veo3.1-fast-components | 0.26 | ¥0.26 | 最便宜，快速测试 |
| veo_3_1-fast | 0.52 | ¥0.52 | 快速生成 |
| veo3.1-components | 0.78 | ¥0.78 | 标准组件 |
| veo3.1 | 1.04 | ¥1.04 | 标准质量 |
| veo_3_1-4K | 1.56 | ¥1.56 | 4K 高清 |
| veo3-frames | 2.60 | ¥2.60 | 帧生成 |
| veo3.1-pro | 5.20 | ¥5.20 | 专业级 |
| veo3.1-pro-4k | 7.80 | ¥7.80 | 4K 专业级 |

## 用户界面显示

前端会自动显示小数积分：

- **模型选择器**: "Veo 3.1 Fast (0.52 积分)"
- **生成按钮**: 显示当前所需积分（如 "0.26"）
- **余额不足提示**: "需要 0.52 积分，当前余额 0.3 积分"

## 验证

```bash
# 测试积分接口
curl -H "Authorization: Bearer <token>" http://localhost:3002/credits/costs

# 预期输出示例:
# {"costs":[
#   {"model":"veo3.1-fast-components","cost":0.26},
#   {"model":"veo_3_1-fast","cost":0.52},
#   ...
# ]}
```

## 用户充值建议

由于积分现在使用小数，建议用户充值时：

- **最小充值**: ¥1 = 1 积分
- **可生成次数示例**:
  - 充值 ¥1 → 约可生成 3-4 次（使用 veo3.1-fast-components）
  - 充值 ¥10 → 约可生成 19 次（使用 veo_3_1-fast）
  - 充值 ¥100 → 约可生成 96 次（使用 veo3.1）

## 数据库影响

**User 表**: `credits` 字段为 `REAL` 类型，支持小数存储。

**Transaction 表**: `amount` 字段为 `REAL` 类型，支持小数记录。

当前测试用户（ID: 8）余额：2 积分

## 注意事项

1. **精度处理**: JavaScript 浮点数运算可能有精度问题，建议在关键计算时使用 `Math.round(amount * 100) / 100`
2. **显示格式**: 前端已自动处理小数显示，`toString()` 会正确显示
3. **价格更新**: 如 aiapikey.ai 价格变动，只需修改 `credits.service.ts` 中的配置并重启
4. **环境变量**: 也可通过 `.env` 的 `CREDIT_COSTS` 覆盖配置

## 清理的文件

已删除以下包含其他网站参考的文件：
- ✅ `/root/ccccckv/rocket-plan/UPDATE_CREDIT_COSTS.md`
- ✅ `/root/ccccckv/rocket-plan/backend/update-credit-costs.js`

## 定价数据来源

**唯一来源**: https://aiapikey.ai/pricing

所有积分配置严格基于该网站的 CNY 定价，不参考其他 API 提供商。

---

**更新时间**: 2026-03-30
**配置状态**: ✅ 生产就绪
