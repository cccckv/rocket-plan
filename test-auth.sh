#!/bin/bash

# 认证系统快速测试脚本

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Rocket Plan 认证系统测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试邮箱和手机号
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PHONE="+86138$(date +%s | tail -c 9)"
TEST_PASSWORD="Test123456"

echo "📋 测试信息:"
echo "   邮箱: $TEST_EMAIL"
echo "   手机: $TEST_PHONE"
echo "   密码: $TEST_PASSWORD"
echo

# 检查服务状态
echo "1️⃣ 检查服务状态..."
if curl -s http://localhost:3002/ > /dev/null; then
    echo -e "   ${GREEN}✅ 后端运行正常${NC} (http://localhost:3002)"
else
    echo -e "   ${RED}❌ 后端未运行${NC}"
    echo "   请先运行: ./start.sh"
    exit 1
fi

if curl -s -I http://localhost:3001/ | head -1 | grep -q "200"; then
    echo -e "   ${GREEN}✅ 前端运行正常${NC} (http://localhost:3001)"
else
    echo -e "   ${RED}❌ 前端未运行${NC}"
    echo "   请先运行: cd frontend && npm run dev"
    exit 1
fi

if redis-cli ping > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Redis 运行正常${NC}"
else
    echo -e "   ${RED}❌ Redis 未运行${NC}"
    echo "   请先运行: redis-server --daemonize yes"
    exit 1
fi
echo

# 测试邮箱注册
echo "2️⃣ 测试邮箱注册流程..."
echo "   发送邮箱验证码..."
SEND_RESULT=$(curl -s -X POST http://localhost:3002/auth/send-email-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"purpose\":\"register\"}")

if echo "$SEND_RESULT" | grep -q "successfully"; then
    echo -e "   ${GREEN}✅ 验证码发送成功${NC}"
else
    echo -e "   ${RED}❌ 验证码发送失败${NC}"
    echo "   响应: $SEND_RESULT"
    exit 1
fi

echo "   等待验证码生成..."
sleep 2

# 从日志获取验证码
OTP=$(tail -100 /tmp/rocket-plan-backend.log | grep -a "DEV MODE.*Email OTP for $TEST_EMAIL" | tail -1 | grep -oP '\d{6}' | tail -1)

if [ -z "$OTP" ]; then
    echo -e "   ${RED}❌ 无法从日志获取验证码${NC}"
    echo "   请手动查看: tail -20 /tmp/rocket-plan-backend.log | grep 'Email OTP'"
    exit 1
fi

echo -e "   ${BLUE}📧 验证码: $OTP${NC}"

echo "   执行注册..."
REGISTER_RESULT=$(curl -s -X POST http://localhost:3002/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\":\"测试用户\",
    \"email\":\"$TEST_EMAIL\",
    \"otp\":\"$OTP\",
    \"password\":\"$TEST_PASSWORD\"
  }")

if echo "$REGISTER_RESULT" | grep -q "accessToken"; then
    echo -e "   ${GREEN}✅ 注册成功${NC}"
    ACCESS_TOKEN=$(echo "$REGISTER_RESULT" | grep -oP '(?<="accessToken":")[^"]+')
else
    echo -e "   ${RED}❌ 注册失败${NC}"
    echo "   响应: $REGISTER_RESULT"
    exit 1
fi
echo

# 测试登录
echo "3️⃣ 测试邮箱登录..."
LOGIN_RESULT=$(curl -s -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"account\":\"$TEST_EMAIL\",
    \"password\":\"$TEST_PASSWORD\"
  }")

if echo "$LOGIN_RESULT" | grep -q "accessToken"; then
    echo -e "   ${GREEN}✅ 登录成功${NC}"
    ACCESS_TOKEN=$(echo "$LOGIN_RESULT" | grep -oP '(?<="accessToken":")[^"]+')
else
    echo -e "   ${RED}❌ 登录失败${NC}"
    echo "   响应: $LOGIN_RESULT"
    exit 1
fi
echo

# 测试邮箱大小写
echo "4️⃣ 测试邮箱大小写标准化..."
UPPER_EMAIL=$(echo "$TEST_EMAIL" | tr '[:lower:]' '[:upper:]')
echo "   使用大写邮箱登录: $UPPER_EMAIL"

UPPER_LOGIN=$(curl -s -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"account\":\"$UPPER_EMAIL\",
    \"password\":\"$TEST_PASSWORD\"
  }")

if echo "$UPPER_LOGIN" | grep -q "accessToken"; then
    echo -e "   ${GREEN}✅ 大小写标准化成功${NC}"
else
    echo -e "   ${RED}❌ 大小写标准化失败${NC}"
    exit 1
fi
echo

# 测试 Token 验证
echo "5️⃣ 测试 Token 验证..."
ME_RESULT=$(curl -s http://localhost:3002/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$ME_RESULT" | grep -q "email"; then
    echo -e "   ${GREEN}✅ Token 验证成功${NC}"
    USER_ID=$(echo "$ME_RESULT" | grep -oP '(?<="id":)\d+')
    echo "   用户 ID: $USER_ID"
else
    echo -e "   ${RED}❌ Token 验证失败${NC}"
    echo "   响应: $ME_RESULT"
    exit 1
fi
echo

# 测试密码重置
echo "6️⃣ 测试密码重置流程..."
echo "   发送重置验证码..."
RESET_SEND=$(curl -s -X POST http://localhost:3002/auth/send-email-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"purpose\":\"reset\"}")

if echo "$RESET_SEND" | grep -q "successfully"; then
    echo -e "   ${GREEN}✅ 重置验证码发送成功${NC}"
else
    echo -e "   ${RED}❌ 重置验证码发送失败${NC}"
    exit 1
fi

sleep 2

# 获取重置验证码
RESET_OTP=$(tail -100 /tmp/rocket-plan-backend.log | grep -a "DEV MODE.*Email OTP for $TEST_EMAIL" | tail -1 | grep -oP '\d{6}' | tail -1)

if [ -z "$RESET_OTP" ]; then
    echo -e "   ${YELLOW}⚠️  无法自动获取重置验证码，跳过重置测试${NC}"
else
    echo -e "   ${BLUE}📧 重置验证码: $RESET_OTP${NC}"
    
    NEW_PASSWORD="NewPass123456"
    echo "   执行密码重置..."
    RESET_RESULT=$(curl -s -X POST http://localhost:3002/auth/reset-password-email \
      -H "Content-Type: application/json" \
      -d "{
        \"email\":\"$TEST_EMAIL\",
        \"otp\":\"$RESET_OTP\",
        \"newPassword\":\"$NEW_PASSWORD\"
      }")

    if echo "$RESET_RESULT" | grep -q "successfully"; then
        echo -e "   ${GREEN}✅ 密码重置成功${NC}"
        
        # 测试新密码登录
        echo "   测试新密码登录..."
        NEW_LOGIN=$(curl -s -X POST http://localhost:3002/auth/login \
          -H "Content-Type: application/json" \
          -d "{
            \"account\":\"$TEST_EMAIL\",
            \"password\":\"$NEW_PASSWORD\"
          }")

        if echo "$NEW_LOGIN" | grep -q "accessToken"; then
            echo -e "   ${GREEN}✅ 新密码登录成功${NC}"
        else
            echo -e "   ${RED}❌ 新密码登录失败${NC}"
        fi
    else
        echo -e "   ${RED}❌ 密码重置失败${NC}"
        echo "   响应: $RESET_RESULT"
    fi
fi
echo

# 测试 OTP 用途隔离
echo "7️⃣ 测试 OTP 用途隔离..."
TEST_ISOLATION_EMAIL="isolation-$(date +%s)@example.com"

echo "   发送注册验证码..."
curl -s -X POST http://localhost:3002/auth/send-email-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_ISOLATION_EMAIL\",\"purpose\":\"register\"}" > /dev/null

sleep 2

REGISTER_OTP=$(tail -100 /tmp/rocket-plan-backend.log | grep -a "DEV MODE.*Email OTP for $TEST_ISOLATION_EMAIL" | tail -1 | grep -oP '\d{6}' | tail -1)

if [ -n "$REGISTER_OTP" ]; then
    echo "   尝试用注册 OTP 重置密码（应该失败）..."
    ISOLATION_TEST=$(curl -s -X POST http://localhost:3002/auth/reset-password-email \
      -H "Content-Type: application/json" \
      -d "{
        \"email\":\"$TEST_ISOLATION_EMAIL\",
        \"otp\":\"$REGISTER_OTP\",
        \"newPassword\":\"Test123456\"
      }")

    if echo "$ISOLATION_TEST" | grep -q "expired or not found"; then
        echo -e "   ${GREEN}✅ OTP 用途隔离成功${NC} (注册 OTP 不能用于重置)"
    else
        echo -e "   ${RED}❌ OTP 用途隔离失败${NC}"
        echo "   响应: $ISOLATION_TEST"
    fi
else
    echo -e "   ${YELLOW}⚠️  无法获取验证码，跳过隔离测试${NC}"
fi
echo

# 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 测试完成！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "✅ 已完成的测试:"
echo "   1. 邮箱注册"
echo "   2. 邮箱登录"
echo "   3. 邮箱大小写标准化"
echo "   4. Token 验证"
echo "   5. 密码重置"
echo "   6. OTP 用途隔离"
echo
echo "📍 前端访问地址:"
echo "   注册: http://localhost:3001/register"
echo "   登录: http://localhost:3001/login"
echo "   忘记密码: http://localhost:3001/forgot-password"
echo
echo "🧪 测试账号:"
echo "   邮箱: $TEST_EMAIL"
echo "   密码: NewPass123456 (如果重置成功) 或 $TEST_PASSWORD"
echo
echo "📖 完整测试文档: TESTING_GUIDE.md"
echo
