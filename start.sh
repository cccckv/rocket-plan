#!/bin/bash

# Rocket Plan 快速启动脚本

set -e

echo "🚀 Starting Rocket Plan Backend..."
echo

# 检查 Redis
echo "1️⃣ Checking Redis..."
if redis-cli ping > /dev/null 2>&1; then
    echo "   ✅ Redis is running"
else
    echo "   ❌ Redis is not running. Starting Redis..."
    redis-server --daemonize yes
    sleep 2
    echo "   ✅ Redis started"
fi
echo

# 检查后端进程
echo "2️⃣ Checking backend process..."
if pgrep -f "nest start" > /dev/null; then
    echo "   ⚠️  Backend is already running"
    echo "   Run './stop.sh' first if you want to restart"
else
    echo "   Starting backend..."
    cd backend
    nohup npm run start:dev > /tmp/rocket-plan-backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    echo "   ✅ Backend started (PID: $BACKEND_PID)"
fi
echo

# 等待服务启动
echo "3️⃣ Waiting for service to be ready..."
sleep 15

# 测试服务
echo "4️⃣ Testing service..."
if curl -s http://localhost:3002/ > /dev/null; then
    echo "   ✅ Service is responding"
else
    echo "   ❌ Service is not responding"
    echo "   Check logs: tail -f /tmp/rocket-plan-backend.log"
    exit 1
fi
echo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Rocket Plan Backend is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "📍 Backend URL: http://localhost:3002"
echo "📝 Logs:        tail -f /tmp/rocket-plan-backend.log"
echo "📊 Prisma:      cd backend && npx prisma studio"
echo
echo "🧪 Test endpoints:"
echo "   curl http://localhost:3002/"
echo "   curl http://localhost:3002/auth/me"
echo
echo "📖 Full documentation: DEPLOYMENT_SUMMARY.md"
echo
