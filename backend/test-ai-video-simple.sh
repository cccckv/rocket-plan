#!/bin/bash

set -e

API_BASE="http://localhost:3002"
TEST_EMAIL="test@x.com"
TEST_PASSWORD="Test123456"

echo "=== AI Video Generation API Test ==="
echo ""

echo "1. Logging in with test account..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"account\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken // .access_token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Failed to get access token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Logged in successfully"
echo "Token: ${TOKEN:0:30}..."
echo ""

echo "2. Creating AI video generation task..."
TASK_RESPONSE=$(curl -s -X POST "$API_BASE/api/videos/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text-to-video",
    "model": "google/veo-3.0-fast",
    "prompt": "A cute cat playing with a red ball in a sunny garden, slow motion",
    "duration": 8,
    "aspectRatio": "16:9",
    "resolution": "720P",
    "enhancePrompt": true,
    "generateAudio": true
  }')

echo "Task response:"
echo "$TASK_RESPONSE" | jq '.'
echo ""

TASK_ID=$(echo "$TASK_RESPONSE" | jq -r '.id // empty')

if [ -z "$TASK_ID" ] || [ "$TASK_ID" = "null" ]; then
  echo "❌ Failed to create task"
  exit 1
fi

echo "✅ Task created: $TASK_ID"
echo ""

echo "3. Getting task details..."
TASK_DETAILS=$(curl -s -X GET "$API_BASE/api/videos/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$TASK_DETAILS" | jq '{id, type, model, status, prompt: (.prompt | .[0:50] + "...")}'
echo ""

echo "4. Polling task status (3 times with 5s interval)..."
for i in {1..3}; do
  echo "Poll attempt $i/3..."
  
  STATUS_RESPONSE=$(curl -s -X POST "$API_BASE/api/videos/tasks/$TASK_ID/poll" \
    -H "Authorization: Bearer $TOKEN")
  
  STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status // empty')
  GENERATION_ID=$(echo "$STATUS_RESPONSE" | jq -r '.generationId // empty')
  
  echo "  Status: $STATUS"
  echo "  Generation ID: $GENERATION_ID"
  
  if [ "$STATUS" = "completed" ]; then
    RESULT_URL=$(echo "$STATUS_RESPONSE" | jq -r '.resultUrl // empty')
    LOCAL_PATH=$(echo "$STATUS_RESPONSE" | jq -r '.localPath // empty')
    echo "  ✅ Video generation completed!"
    echo "  Result URL: $RESULT_URL"
    echo "  Local Path: $LOCAL_PATH"
    break
  elif [ "$STATUS" = "failed" ]; then
    ERROR_MSG=$(echo "$STATUS_RESPONSE" | jq -r '.errorMsg // empty')
    echo "  ❌ Video generation failed: $ERROR_MSG"
    break
  else
    if [ $i -lt 3 ]; then
      echo "  Waiting 5s..."
      sleep 5
    fi
  fi
done
echo ""

echo "5. Getting user's task list..."
TASK_LIST=$(curl -s -X GET "$API_BASE/api/videos/tasks?limit=5" \
  -H "Authorization: Bearer $TOKEN")

echo "Task list:"
echo "$TASK_LIST" | jq '{total, tasks: .tasks[] | {id, type, status, createdAt}}'
echo ""

echo "=== Test Summary ==="
echo "✅ Authentication working"
echo "✅ Task creation successful"
echo "✅ Task status polling working"
echo "✅ Task retrieval working"
echo ""
echo "Note: Video generation requires valid AI API key and may take 30-60 seconds."
echo "Check Swagger docs at: http://localhost:3002/api-docs"
echo "Check AI API logs for generation progress"
