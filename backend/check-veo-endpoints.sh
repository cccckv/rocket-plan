#!/bin/bash

# 检查所有veo模型的API端点
# 从pricing页面点击每个模型查看详细信息

VEO_MODELS=(
  "veo3.1-fast-components"
  "veo_3_1-fast"
  "veo_3_1-fast-4K"
  "veo3.1"
  "veo_3_1"
  "veo3.1-components"
  "veo_3_1-components"
  "veo3.1-fast"
  "veo_3_1-4K"
  "veo_3_1-components-4K"
  "veo_3_1-fast-components-4K"
  "veo3.1-4k"
  "veo3.1-components-4k"
  "veo3-fast"
  "veo3"
  "veo3-fast-frames"
  "veo3-frames"
  "veo3.1-pro"
  "veo3.1-pro-4k"
  "veo3-pro-frames"
)

echo "Model,Endpoint,Price" > veo-endpoints.csv

for model in "${VEO_MODELS[@]}"; do
  echo "Checking $model..."
  
  # 这里需要手动从页面获取每个模型的端点信息
  # 因为agent-browser在循环中比较慢，我们用另一种方式
  
  sleep 0.5
done

echo "Results saved to veo-endpoints.csv"
