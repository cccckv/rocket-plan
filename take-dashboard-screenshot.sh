#!/bin/bash

echo "=== Dashboard 截图工具 ==="
echo ""
echo "此脚本需要 Chrome/Chromium 浏览器"
echo ""

URL="http://localhost:3001/dashboard"
OUTPUT="dashboard-screenshot-$(date +%Y%m%d-%H%M%S).png"

if ! command -v google-chrome &> /dev/null && ! command -v chromium-browser &> /dev/null; then
    echo "错误: 未找到 Chrome 或 Chromium 浏览器"
    echo "请安装: apt-get install chromium-browser"
    exit 1
fi

CHROME_BIN="google-chrome"
if ! command -v google-chrome &> /dev/null; then
    CHROME_BIN="chromium-browser"
fi

echo "正在访问: $URL"
echo "截图保存至: $OUTPUT"

$CHROME_BIN --headless --disable-gpu --screenshot="$OUTPUT" --window-size=1920,1080 "$URL" 2>/dev/null

if [ -f "$OUTPUT" ]; then
    echo "✓ 截图成功: $OUTPUT"
    ls -lh "$OUTPUT"
else
    echo "✗ 截图失败"
    exit 1
fi
