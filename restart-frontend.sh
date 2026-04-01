#!/bin/bash

echo "🔄 Restarting Frontend Service..."

# Kill old processes
echo "📛 Stopping old frontend processes..."
pkill -9 -f "next start"
pkill -9 -f "next-server"

# Wait for processes to terminate
echo "⏳ Waiting for processes to terminate..."
MAX_WAIT=10
WAITED=0
while pgrep -f "next-server" > /dev/null && [ $WAITED -lt $MAX_WAIT ]; do
    sleep 1
    WAITED=$((WAITED + 1))
done

if pgrep -f "next-server" > /dev/null; then
    echo "❌ Failed to stop old processes"
    exit 1
fi

echo "✅ Old processes stopped"

# Clean build cache
echo "🧹 Cleaning build cache..."
cd /root/ccccckv/rocket-plan/frontend
rm -rf .next/cache

# Start new process
echo "🚀 Starting frontend..."
nohup npm start > /tmp/frontend-restart-$(date +%s).log 2>&1 &

# Wait for startup
echo "⏳ Waiting for frontend to start..."
sleep 5

# Verify
if ss -tlnp | grep -q ":3001"; then
    PID=$(ss -tlnp | grep ":3001" | grep -oP 'pid=\K[0-9]+' | head -1)
    echo "✅ Frontend started successfully"
    echo "   PID: $PID"
    echo "   Port: 3001"
    echo "   URL: http://45.76.70.183/"
else
    echo "❌ Frontend failed to start"
    echo "   Check logs: ls -lt /tmp/frontend-restart-*.log | head -1"
    exit 1
fi

echo ""
echo "🎉 Restart completed!"
