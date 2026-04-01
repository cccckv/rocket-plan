# Veo 模型规格配置

## 概述

根据 aiapikey.ai API 规范，配置每个 Veo 模型支持的参数选项，并在前端动态禁用不支持的选项。

## 支持的规格

### 全部模型通用规格

| 参数 | 支持选项 | 不支持选项 |
|------|---------|-----------|
| **画面比例** | 16:9, 9:16 | ❌ 1:1 (方形) |
| **视频时长** | 4-8 秒 | ❌ 15秒, 25秒 |
| **基础分辨率** | 720P, 1080P | - |

### 4K 模型专属

以下模型支持 4K 分辨率：

1. veo_3_1-fast-4K
2. veo_3_1-4K
3. veo_3_1-components-4K
4. veo_3_1-fast-components-4K
5. veo3.1-4k
6. veo3.1-components-4k
7. veo3.1-pro-4k

**其他模型不支持 4K 分辨率。**

## 前端实现

### 配置文件

**文件**: `frontend/lib/model-specs.ts`

定义了每个模型的规格配置：

```typescript
export interface ModelSpecs {
  supportedResolutions: string[];        // 支持的分辨率
  supportedAspectRatios: string[];       // 支持的画面比例
  supportedDurations: number[];          // 支持的时长（秒）
  maxDuration: number;                   // 最大时长
  minDuration: number;                   // 最小时长
  supports4K: boolean;                   // 是否支持4K
  supportsAudio: boolean;                // 是否支持音频
}
```

### 动态禁用逻辑

**文件**: `frontend/components/video-generator-form.tsx`

根据选择的模型动态禁用不支持的选项：

```typescript
const modelSpecs = getModelSpecs(selectedModel);

// 4K 选项
<SelectItem 
  value="4k" 
  disabled={!modelSpecs.supports4K}
>
  4K {!modelSpecs.supports4K && '(不支持)'}
</SelectItem>

// 1:1 比例（所有模型都不支持）
<SelectItem value="1:1" disabled>
  1:1 (方形) (不支持)
</SelectItem>

// 15秒和25秒（所有模型都不支持）
<SelectItem value="15s" disabled>
  15 秒 (不支持)
</SelectItem>
```

## 用户界面效果

### 标准模型（如 veo3.1-fast）

选择框中：
- ✅ 720P - 可选
- ✅ 1080P - 可选
- ❌ 4K - **禁用灰色** (不支持)

画面比例：
- ✅ 16:9 - 可选
- ✅ 9:16 - 可选
- ❌ 1:1 - **禁用灰色** (不支持)

视频时长：
- ✅ 4秒 - 可选
- ✅ 5秒 - 可选
- ✅ 6秒 - 可选
- ✅ 7秒 - 可选
- ✅ 8秒 - 可选
- ❌ 15秒 - **禁用灰色** (不支持)
- ❌ 25秒 - **禁用灰色** (不支持)

### 4K 模型（如 veo3.1-pro-4k）

选择框中：
- ✅ 720P - 可选
- ✅ 1080P - 可选
- ✅ **4K - 可选** ✨

画面比例：同标准模型

视频时长：同标准模型

## API 规范参考

根据 `backend/src/videos/dto/create-video-task.dto.ts`：

```typescript
export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
  // 没有 SQUARE = '1:1'
}

export enum Resolution {
  HD_720P = '720P',
  FHD_1080P = '1080P',
  // 4K 通过特定模型支持
}

// 时长限制
@Min(4)
@Max(8)
duration?: number;
```

## 禁用选项的视觉效果

禁用的选项会：
1. **灰色显示** - 降低文字不透明度
2. **禁止点击** - `disabled` 属性
3. **显示提示** - "(不支持)" 文字说明
4. **鼠标样式** - `cursor: not-allowed`

## 更新日志

### 2026-03-30

1. ✅ 创建模型规格配置文件
2. ✅ 所有模型配置完成（21个）
3. ✅ 禁用 1:1 画面比例（所有模型）
4. ✅ 禁用 15秒 和 25秒时长（所有模型）
5. ✅ 4K 选项根据模型动态启用/禁用
6. ✅ 添加 4秒、6秒、7秒 时长选项

## 未来扩展

如果 API 更新支持更多规格：

### 添加新的画面比例

```typescript
// 1. 更新 model-specs.ts
supportedAspectRatios: ['16:9', '9:16', '1:1']

// 2. 更新 video-generator-form.tsx
<SelectItem 
  value="1:1" 
  disabled={!modelSpecs.supportedAspectRatios.includes('1:1')}
>
  1:1 (方形)
</SelectItem>
```

### 添加新的时长选项

```typescript
// 1. 更新 model-specs.ts
supportedDurations: [4, 5, 6, 7, 8, 10, 15]
maxDuration: 15

// 2. 添加选项
<SelectItem 
  value="10s"
  disabled={!modelSpecs.supportedDurations.includes(10)}
>
  10 秒
</SelectItem>
```

## 测试验证

### 测试步骤

1. 访问首页: http://45.76.70.183/
2. 选择不同模型
3. 点击设置按钮（齿轮图标）
4. 验证选项状态

### 预期结果

| 模型 | 4K选项 | 1:1选项 | 15秒选项 |
|------|--------|---------|---------|
| veo3.1-fast | ❌ 禁用 | ❌ 禁用 | ❌ 禁用 |
| veo3.1-pro-4k | ✅ 可用 | ❌ 禁用 | ❌ 禁用 |
| veo_3_1-4K | ✅ 可用 | ❌ 禁用 | ❌ 禁用 |

## 技术细节

### React Hook 优化

使用 `useMemo` 避免不必要的重新计算：

```typescript
const modelSpecs = React.useMemo(
  () => getModelSpecs(selectedModel), 
  [selectedModel]
);
```

### 类型安全

所有配置使用 TypeScript 接口保证类型安全：

```typescript
export interface ModelSpecs {
  // 所有字段都有明确类型
  supportedResolutions: string[];
  supports4K: boolean;
  // ...
}
```

### 默认配置

如果模型未配置，使用默认规格：

```typescript
export const DEFAULT_MODEL_SPECS: ModelSpecs = {
  supportedResolutions: ['720P', '1080P'],
  supportedAspectRatios: ['16:9', '9:16'],
  supportedDurations: [4, 5, 6, 7, 8],
  maxDuration: 8,
  minDuration: 4,
  supports4K: false,
  supportsAudio: true,
};
```

## 总结

✅ **所有模型的规格限制已正确配置**

- 1:1 画面比例：全部禁用（Veo 不支持）
- 15秒/25秒时长：全部禁用（Veo 限制 4-8秒）
- 4K 分辨率：仅 7 个 4K 模型可用
- 4-8秒时长：全部可用
- 16:9/9:16比例：全部可用

用户现在无法选择模型不支持的选项，避免 API 错误！

---

**配置文件**: `frontend/lib/model-specs.ts`  
**更新时间**: 2026-03-30  
**模型总数**: 21 个  
**状态**: ✅ 完成
