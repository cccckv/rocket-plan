# 从官网获取真实价格更新

## 数据来源

✅ **使用 /root/.agent-browser 访问 https://aiapikey.ai/pricing?keyword=veo**

通过 Playwright 自动化浏览器获取最新价格数据。

## 获取到的真实价格

```json
{
  "veo3.1-fast-components": 0.26,
  "veo_3_1-fast-components": 0.26,
  "veo_3_1-fast": 0.43,
  "veo_3_1-fast-4K": 0.43,
  "veo3.1-fast": 0.70,
  "veo3-fast": 0.90,
  "veo3.1": 0.70,
  "veo_3_1": 0.73,
  "veo3.1-components": 0.70,
  "veo_3_1-components": 0.73,
  "veo3": 0.90,
  "veo_3_1-4K": 0.85,
  "veo_3_1-components-4K": 0.85,
  "veo_3_1-fast-components-4K": 0.86,
  "veo3.1-4k": 1.00,
  "veo3.1-components-4k": 1.00,
  "veo3-fast-frames": 0.90,
  "veo3-frames": 0.90,
  "veo3-pro-frames": 4.00,
  "veo3.1-pro": 3.50,
  "veo3.1-pro-4k": 3.50
}
```

## 价格对比

| 模型 | 之前配置 | 官网实际价格 | 差异 | 状态 |
|------|---------|------------|------|------|
| veo3.1-fast-components | 0.26 | 0.26 | ✅ 相同 | 保持 |
| veo_3_1-fast | 0.52 | 0.43 | ❌ 高0.09 | **已修正** |
| veo_3_1-fast-4K | 0.78 | 0.43 | ❌ 高0.35 | **已修正** |
| veo3.1-fast | 0.52 | 0.70 | ❌ 低0.18 | **已修正** |
| veo3.1 | 1.04 | 0.70 | ❌ 高0.34 | **已修正** |
| veo_3_1 | 1.04 | 0.73 | ❌ 高0.31 | **已修正** |
| veo3.1-components | 0.78 | 0.70 | ❌ 高0.08 | **已修正** |
| veo_3_1-4K | 1.56 | 0.85 | ❌ 高0.71 | **已修正** |
| veo_3_1-components-4K | 1.56 | 0.85 | ❌ 高0.71 | **已修正** |
| veo3.1-4k | 1.56 | 1.00 | ❌ 高0.56 | **已修正** |
| veo3.1-pro | 5.20 | 3.50 | ❌ 高1.70 | **已修正** |
| veo3.1-pro-4k | 7.80 | 3.50 | ❌ 高4.30 | **已修正** |
| veo3-pro-frames | 3.64 | 4.00 | ❌ 低0.36 | **已修正** |
| veo3-fast-frames | 2.08 | 0.90 | ❌ 高1.18 | **已修正** |
| veo3-frames | 2.60 | 0.90 | ❌ 高1.70 | **已修正** |

## 主要发现

### 价格显著降低的模型

1. **veo3.1-pro-4k**: 从 7.80 降至 3.50 (降低 55%)
2. **veo3-frames**: 从 2.60 降至 0.90 (降低 65%)
3. **veo3.1-pro**: 从 5.20 降至 3.50 (降低 33%)
4. **veo3-fast-frames**: 从 2.08 降至 0.90 (降低 57%)

### 价格略有上涨的模型

1. **veo3.1-fast**: 从 0.52 升至 0.70 (上涨 35%)
2. **veo3-pro-frames**: 从 3.64 升至 4.00 (上涨 10%)

## 更新的文件

### 1. 后端配置
**文件**: `backend/src/credits/credits.service.ts`

✅ 已更新所有 21 个模型的真实价格

### 2. 前端配置
**文件**: `frontend/lib/api/credits.ts`

✅ 已同步更新所有 21 个模型的默认价格

### 3. 服务重启
✅ 后端已重启并验证新价格生效

## 价格区间分析

### 超低成本 (¥0.26)
- veo3.1-fast-components
- veo_3_1-fast-components

### 低成本 (¥0.43)
- veo_3_1-fast
- veo_3_1-fast-4K

### 标准 (¥0.70-0.73)
- veo3.1
- veo3.1-fast
- veo3.1-components
- veo_3_1
- veo_3_1-components

### 4K (¥0.85-1.00)
- veo_3_1-4K
- veo_3_1-components-4K
- veo_3_1-fast-components-4K
- veo3.1-4k
- veo3.1-components-4k

### 标准帧和快速 (¥0.90)
- veo3
- veo3-fast
- veo3-fast-frames
- veo3-frames

### 专业级 (¥3.50-4.00)
- veo3.1-pro
- veo3.1-pro-4k
- veo3-pro-frames

## 用户影响

### 积极影响 ✅

大部分模型价格**降低**，用户能以更低成本生成视频：

- **专业级大幅降价**: veo3.1-pro-4k 从 ¥7.80 降至 ¥3.50，降低 55%
- **帧模型更便宜**: veo3-frames 从 ¥2.60 降至 ¥0.90，降低 65%
- **标准模型降价**: veo3.1 从 ¥1.04 降至 ¥0.70，降低 33%

### 需要注意 ⚠️

少数模型价格上涨：

- veo3.1-fast: ¥0.52 → ¥0.70 (+35%)
- veo3-pro-frames: ¥3.64 → ¥4.00 (+10%)

## 获取方法

使用 Playwright 自动化浏览器：

```javascript
const { chromium } = require('playwright');

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox']
});

const page = await browser.newPage();
await page.goto('https://aiapikey.ai/pricing?keyword=veo');
await page.waitForTimeout(10000);

// 提取价格数据
const pricing = await page.evaluate(() => {
  // 查找包含 "Model price 💰" 的文本
  const text = document.body.innerText;
  // 解析价格...
});
```

## 验证

### API 验证

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3002/credits/costs

# 返回示例:
# {
#   "costs": [
#     {"model": "veo3.1-fast-components", "cost": 0.26},
#     {"model": "veo_3_1-fast", "cost": 0.43},
#     {"model": "veo3.1", "cost": 0.70},
#     {"model": "veo3.1-pro", "cost": 3.50},
#     ...
#   ]
# }
```

### 前端验证

访问 http://45.76.70.183/ 查看模型选择框，应显示更新后的价格。

## 建议

### 用户通知

建议通知用户价格已更新，大部分模型价格**降低**：

```
🎉 好消息！视频生成价格已更新

✅ 多数模型降价 30-65%
✅ 专业级模型大幅降价
✅ 相同预算可生成更多视频

详情请查看模型选择框的最新价格
```

### 充值建议更新

基于新价格，充值建议：

| 充值金额 | 推荐使用 | 可生成次数 |
|---------|---------|-----------|
| ¥10 | veo_3_1-fast (¥0.43) | 约 23 次 |
| ¥10 | veo3.1 (¥0.70) | 约 14 次 |
| ¥50 | veo3.1-pro (¥3.50) | 约 14 次 |
| ¥100 | veo3.1-pro-4k (¥3.50) | 约 28 次 |

## 总结

✅ **所有价格已更新为 aiapikey.ai 官网真实价格**

- 数据来源: https://aiapikey.ai/pricing?keyword=veo
- 获取方式: /root/.agent-browser + Playwright
- 更新时间: 2026-03-30
- 模型数量: 21 个
- 后端状态: ✅ 已重启并验证
- 前端状态: ✅ 已更新配置

**用户现在看到的所有价格都是真实、准确的官网价格！**

---

**重要提示**: 
- aiapikey.ai 的价格可能随时调整
- 建议定期（每周/每月）重新获取价格更新
- 可将此脚本设置为定时任务自动更新
