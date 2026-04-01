#!/bin/bash

# 逐个检查veo模型的API端点

MODELS=(
  "veo_3_1-components-4K:e48"
  "veo_3_1-4K:e54"
  "veo_3_1-fast-4K:e60"
  "veo_3_1-fast-components-4K:e66"
  "veo3.1-4k:e72"
  "veo3.1-components-4k:e78"
  "veo_3_1:e84"
  "veo_3_1-components:e90"
  "veo_3_1-fast:e96"
  "veo3.1:e102"
  "veo3.1-pro:e108"
  "veo3.1-pro-4k:e114"
  "veo3-pro-frames:e120"
  "veo3.1-components:e126"
  "veo3.1-fast-components:e132"
  "veo3.1-fast:e138"
  "veo3:e144"
  "veo3-fast:e150"
  "veo3-fast-frames:e156"
  "veo3-frames:e162"
)

echo "Model,Endpoint" > veo-endpoints.csv

for model_ref in "${MODELS[@]}"; do
  MODEL="${model_ref%:*}"
  REF="${model_ref#*:}"
  
  echo "Checking $MODEL..."
  
  agent-browser click @$REF
  sleep 2
  
  ENDPOINT=$(agent-browser snapshot | grep -E "(/v1/video/create|/v1/videos|openAI)" | head -1)
  
  agent-browser press Escape
  sleep 0.5
  
  if echo "$ENDPOINT" | grep -q "/v1/video/create"; then
    echo "  ✅ /v1/video/create"
    echo "$MODEL,/v1/video/create" >> veo-endpoints.csv
  elif echo "$ENDPOINT" | grep -q "/v1/videos"; then
    echo "  ✅ /v1/videos"
    echo "$MODEL,/v1/videos" >> veo-endpoints.csv
  elif echo "$ENDPOINT" | grep -q "openAI"; then
    echo "  ✅ /v1/videos (openAI format)"
    echo "$MODEL,/v1/videos" >> veo-endpoints.csv
  else
    echo "  ❌ Unknown"
    echo "$MODEL,unknown" >> veo-endpoints.csv
  fi
  
  sleep 1
done

echo ""
echo "Results saved to veo-endpoints.csv"
echo ""
echo "Summary:"
grep "/v1/videos" veo-endpoints.csv | wc -l | xargs echo "/v1/videos models:"
grep "/v1/video/create" veo-endpoints.csv | wc -l | xargs echo "/v1/video/create models:"
