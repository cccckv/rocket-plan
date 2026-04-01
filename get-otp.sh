#!/bin/bash

echo "=== 获取最新的邮箱验证码 ==="
echo

OTP_LINE=$(tail -100 /tmp/rocket-plan-backend.log | grep -a "DEV MODE.*Email OTP for" | tail -1)

if [ -z "$OTP_LINE" ]; then
    echo "❌ 未找到验证码"
    echo
    echo "💡 请先在前端注册页面点击"发送验证码"按钮"
    echo "   然后再运行此脚本"
    exit 1
fi

echo "📧 完整日志:"
echo "$OTP_LINE"
echo

OTP_CODE=$(echo "$OTP_LINE" | grep -oP '\d{6}' | tail -1)

if [ -n "$OTP_CODE" ]; then
    echo "✅ 验证码: $OTP_CODE"
    echo
    echo "📋 已复制到剪贴板（如果支持）"
    echo "$OTP_CODE" | xclip -selection clipboard 2>/dev/null || true
else
    echo "⚠️  无法提取验证码，请手动查看日志"
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 使用方法:"
echo "   1. 在注册页面输入邮箱"
echo "   2. 点击'发送验证码'"
echo "   3. 运行: ./get-otp.sh"
echo "   4. 复制验证码到注册页面"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
