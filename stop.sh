#!/bin/bash

set -e

echo "🛑 Stopping Rocket Plan Backend..."
echo

if pgrep -f "nest start" > /dev/null; then
    echo "Stopping backend processes..."
    pkill -f "nest start"
    sleep 2
    echo "✅ Backend stopped"
else
    echo "⚠️  Backend is not running"
fi
echo

if pgrep -f "prisma studio" > /dev/null; then
    echo "Stopping Prisma Studio..."
    pkill -f "prisma studio"
    echo "✅ Prisma Studio stopped"
fi
echo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All services stopped"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "To start again: ./start.sh"
echo
