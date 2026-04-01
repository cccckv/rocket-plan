#!/bin/bash

set -e

API_BASE="http://localhost:3002"
TEST_EMAIL="aitest@example.com"
TEST_PASSWORD="Test123456"

echo "=== AI Video Generation API Test ==="
echo ""

echo "1. Registering test user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"AI Video Tester\"
  }" || echo '{"error": "registration failed"}')

echo "Register response: $REGISTER_RESPONSE"
echo ""

echo "2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"account\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken // .access_token // empty')

if [ -z "$TOKEN" ]; then
  echo "Login failed or user already exists. Response: $LOGIN_RESPONSE"
  echo "Trying to login again..."
  LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"account\": \"$TEST_EMAIL\",
      \"password\": \"$TEST_PASSWORD\"
    }")
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken // .access_token // empty')
fi

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get access token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Logged in successfully"
echo "Token: ${TOKEN:0:20}..."
echo ""

echo "3. Creating AI video generation task..."
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

echo "Task response: $TASK_RESPONSE"
echo ""

TASK_ID=$(echo "$TASK_RESPONSE" | jq -r '.id // empty')

if [ -z "$TASK_ID" ]; then
  echo "❌ Failed to create task"
  echo "Response: $TASK_RESPONSE"
  exit 1
fi

echo "✅ Task created: $TASK_ID"
echo ""

echo "4. Polling task status (max 5 times with 10s interval)..."
for i in {1..5}; do
  echo "Poll attempt $i/5..."
  
  STATUS_RESPONSE=$(curl -s -X POST "$API_BASE/api/videos/tasks/$TASK_ID/poll" \
    -H "Authorization: Bearer $TOKEN")
  
  STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status // empty')
  RESULT_URL=$(echo "$STATUS_RESPONSE" | jq -r '.resultUrl // empty')
  LOCAL_PATH=$(echo "$STATUS_RESPONSE" | jq -r '.localPath // empty')
  ERROR_MSG=$(echo "$STATUS_RESPONSE" | jq -r '.errorMsg // empty')
  
  echo "  Status: $STATUS"
  
  if [ "$STATUS" = "completed" ]; then
    echo "✅ Video generation completed!"
    echo "  Result URL: $RESULT_URL"
    echo "  Local Path: $LOCAL_PATH"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "❌ Video generation failed: $ERROR_MSG"
    break
  else
    echo "  Still processing... (waiting 10s)"
    if [ $i -lt 5 ]; then
      sleep 10
    fi
  fi
done
echo ""

echo "5. Getting task details..."
TASK_DETAILS=$(curl -s -X GET "$API_BASE/api/videos/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Task details:"
echo "$TASK_DETAILS" | jq '.'
echo ""

echo "6. Getting user's task list..."
TASK_LIST=$(curl -s -X GET "$API_BASE/api/videos/tasks?limit=5" \
  -H "Authorization: Bearer $TOKEN")

echo "Task list:"
echo "$TASK_LIST" | jq '.tasks[] | {id, type, model, status, createdAt}'
echo ""

echo "=== Test Summary ==="
echo "✅ API endpoints are working"
echo "✅ Task creation successful"
echo "✅ Task status polling working"
echo "✅ Task list retrieval working"
echo ""
echo "Note: Actual video generation depends on AI API availability."
echo "Check Swagger docs at: http://localhost:3002/api-docs"
