#!/bin/bash

echo "🔄 Restarting Backend Service..."

# Kill old processes
echo "📛 Stopping old backend processes..."
pkill -9 -f "node dist/src/main.js"
pkill -9 -f "nest start"

# Wait for processes to terminate
echo "⏳ Waiting for processes to terminate..."
MAX_WAIT=10
WAITED=0
while pgrep -f "dist/src/main.js" > /dev/null && [ $WAITED -lt $MAX_WAIT ]; do
    sleep 1
    WAITED=$((WAITED + 1))
done

if pgrep -f "dist/src/main.js" > /dev/null; then
    echo "❌ Failed to stop old processes"
    exit 1
fi

echo "✅ Old processes stopped"

# Start new process
echo "🚀 Starting backend..."
cd /root/ccccckv/rocket-plan/backend
nohup npm run start:prod > /tmp/backend-restart-$(date +%s).log 2>&1 &

# Wait for startup
echo "⏳ Waiting for backend to start..."
sleep 5

# Verify
if ss -tlnp | grep -q ":3002"; then
    PID=$(ss -tlnp | grep ":3002" | grep -oP 'pid=\K[0-9]+' | head -1)
    echo "✅ Backend started successfully"
    echo "   PID: $PID"
    echo "   Port: 3002"
    echo "   Test: curl http://localhost:3002/"
else
    echo "❌ Backend failed to start"
    echo "   Check logs: ls -lt /tmp/backend-restart-*.log | head -1"
    exit 1
fi

echo ""
echo "🎉 Restart completed!"
