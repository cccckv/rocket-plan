# 🧪 注册和登录测试指南

## 📋 测试前准备

### 1. 确认服务状态

```bash
# 检查后端状态
curl http://localhost:3002/

# 检查前端状态
curl -I http://localhost:3001/

# 检查 Redis
redis-cli ping
```

**预期输出：**
- 后端：`Hello World!`
- 前端：HTTP 200 状态码
- Redis：`PONG`

---

## 🎯 测试场景

### 场景 1：邮箱注册 + 邮箱登录 ✅

**测试目标：** 验证邮箱注册流程和 OTP 验证次数限制

**步骤：**

1. **打开注册页面**
   ```
   http://localhost:3001/register
   ```

2. **选择"邮箱注册" Tab**（默认已选中）

3. **填写注册信息**
   - 姓名：`测试用户1`
   - 邮箱：`test1@example.com`
   - 密码：`Test123456`

4. **发送验证码**
   - 点击"发送验证码"按钮
   - 前端提示："验证码已发送，请查收邮箱（开发模式下请查看后端日志）"

5. **获取验证码**
   ```bash
   # 方法 1：使用脚本（推荐）
   cd /root/ccccckv/rocket-plan
   ./get-otp.sh
   
   # 方法 2：手动查看日志
   tail -20 /tmp/rocket-plan-backend.log | grep "Email OTP"
   ```
   
   **预期输出：**
   ```
   ✅ 验证码: 123456
   ```

6. **输入验证码并注册**
   - 将验证码粘贴到"邮箱验证码"框
   - 点击"注册"按钮

7. **验证注册成功**
   - 自动跳转到 `/dashboard`
   - 页面显示用户信息（姓名、积分等）

8. **测试登录**
   - 打开：`http://localhost:3001/login`
   - 账号：`test1@example.com`
   - 密码：`Test123456`
   - 点击"登录"

9. **验证登录成功**
   - 跳转到 `/dashboard`
   - localStorage 中有 `accessToken` 和 `refreshToken`

**测试邮箱标准化：**
```bash
# 尝试用大写邮箱登录
账号：TEST1@EXAMPLE.COM
密码：Test123456
```
✅ 应该能成功登录（后端自动标准化为小写）

---

### 场景 2：手机号注册 + 手机号登录 ✅

**测试目标：** 验证手机号注册和 OTP 用途隔离

**步骤：**

1. **打开注册页面**
   ```
   http://localhost:3001/register
   ```

2. **选择"手机号注册" Tab**

3. **填写注册信息**
   - 手机号：`+8613800138000`（必须国际格式）
   - 邮箱（可选）：`test2@example.com`
   - 密码（可选）：`Test123456`

4. **发送验证码**
   - 点击"发送验证码"按钮

5. **获取验证码**
   ```bash
   # 查看 SMS 日志（开发模式）
   tail -20 /tmp/rocket-plan-backend.log | grep "SMS OTP"
   ```
   
   **预期输出：**
   ```
   SMS OTP for +8613800138000: 654321
   ```

6. **输入验证码并注册**

7. **测试手机号登录**
   - 打开：`http://localhost:3001/login`
   - 账号：`+8613800138000`
   - 密码：`Test123456`
   - 点击"登录"

---

### 场景 3：忘记密码（邮箱重置）✅

**测试目标：** 验证密码重置和 OTP 用途隔离

**步骤：**

1. **打开忘记密码页面**
   ```
   http://localhost:3001/forgot-password
   ```

2. **选择"邮箱重置" Tab**

3. **输入邮箱**
   - 邮箱：`test1@example.com`（之前注册的）

4. **发送验证码**
   - 点击"发送验证码"

5. **获取验证码**
   ```bash
   ./get-otp.sh
   ```

6. **填写新密码**
   - 邮箱验证码：`（从日志获取）`
   - 新密码：`NewPass123456`
   - 确认密码：`NewPass123456`

7. **点击"重置密码"**
   - 提示："密码重置成功，3秒后跳转到登录页面..."
   - 自动跳转到 `/login`

8. **使用新密码登录**
   - 账号：`test1@example.com`
   - 密码：`NewPass123456`

---

### 场景 4：忘记密码（手机号重置）✅

**步骤：**

1. 打开：`http://localhost:3001/forgot-password`
2. 选择"手机号重置" Tab
3. 手机号：`+8613800138000`
4. 发送验证码 → 查看日志获取
5. 输入验证码 + 新密码
6. 重置成功后用新密码登录

---

### 场景 5：Google OAuth 登录 🔐

**测试目标：** 验证 Google OAuth Cookie 方式认证

**步骤：**

1. **打开登录页面**
   ```
   http://localhost:3001/login
   ```

2. **点击"使用 Google 登录"按钮**

3. **Google 授权流程**
   - 跳转到 Google 登录页面
   - 选择账号并授权

4. **验证回调**
   - 自动跳转到 `http://localhost:3001/auth/callback`
   - 显示"正在登录..."加载动画
   - 跳转到 `/dashboard`

5. **验证 Cookie 存储**
   ```javascript
   // 打开浏览器开发者工具 → Application → Cookies
   // 应该看到：
   // - accessToken (HttpOnly)
   // - refreshToken (HttpOnly)
   ```

---

## 🛡️ 安全功能测试

### 测试 1：OTP 验证次数限制 ⏱️

**测试目标：** 验证暴力破解防护

**步骤：**

1. 注册页面发送邮箱验证码
2. 故意输入错误的验证码 **5 次**
3. **预期结果：**
   ```
   Too many failed attempts. Please try again in 10 minutes.
   ```
4. 等待 10 分钟后可再次尝试

---

### 测试 2：OTP 用途隔离 🔒

**测试目标：** 验证注册 OTP 不能用于重置密码

**步骤：**

1. **在注册页面发送邮箱验证码**
   ```bash
   # 记录验证码
   ./get-otp.sh  # 假设得到: 123456
   ```

2. **立即打开忘记密码页面**
   ```
   http://localhost:3001/forgot-password
   ```

3. **尝试使用相同的验证码**
   - 输入同一个邮箱
   - 不发送新验证码
   - 直接输入刚才注册页面的验证码：`123456`
   - 点击"重置密码"

4. **预期结果：**
   ```
   OTP expired or not found
   ```
   ✅ 证明 OTP 按用途隔离成功

---

### 测试 3：邮箱大小写标准化 📧

**测试目标：** 验证不能用大小写创建重复账户

**步骤：**

1. **注册账户**
   - 邮箱：`test3@example.com`
   - 完成注册

2. **尝试用大写注册**
   - 邮箱：`TEST3@EXAMPLE.COM`
   - 发送验证码
   - 输入验证码并提交

3. **预期结果：**
   ```
   Email already registered
   ```

4. **测试登录标准化**
   - 使用大写邮箱登录：`TEST3@EXAMPLE.COM`
   - ✅ 应该能成功登录

---

### 测试 4：发送频率限制 ⏰

**测试目标：** 验证 60 秒内不能重复发送

**步骤：**

1. 点击"发送验证码"
2. 立即再次点击"发送验证码"
3. **预期结果：**
   ```
   Please wait 60 seconds before requesting another OTP
   ```
4. 等待 60 秒后可再次发送

---

## 📊 后端 API 直接测试

### 测试邮箱注册 API

```bash
# 1. 发送邮箱验证码
curl -X POST http://localhost:3002/auth/send-email-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"api-test@example.com","purpose":"register"}'

# 2. 查看验证码
./get-otp.sh

# 3. 注册（替换 YOUR_OTP）
curl -X POST http://localhost:3002/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"API测试用户",
    "email":"api-test@example.com",
    "otp":"YOUR_OTP",
    "password":"Test123456"
  }'

# 4. 登录
curl -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "account":"api-test@example.com",
    "password":"Test123456"
  }'
```

### 测试手机号注册 API

```bash
# 1. 发送手机验证码
curl -X POST http://localhost:3002/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+8613900139000","purpose":"register"}'

# 2. 查看日志获取验证码
tail -20 /tmp/rocket-plan-backend.log | grep "SMS OTP"

# 3. 注册（替换 YOUR_OTP）
curl -X POST http://localhost:3002/auth/register-phone \
  -H "Content-Type: application/json" \
  -d '{
    "phone":"+8613900139000",
    "otp":"YOUR_OTP",
    "email":"phone-test@example.com",
    "password":"Test123456"
  }'
```

---

## 🔍 调试工具

### 查看实时日志

```bash
# 后端日志（推荐在单独的终端窗口运行）
tail -f /tmp/rocket-plan-backend.log

# 过滤 OTP 相关日志
tail -f /tmp/rocket-plan-backend.log | grep -E "(OTP|Email|SMS)"

# 过滤认证相关日志
tail -f /tmp/rocket-plan-backend.log | grep -E "(register|login|reset)"
```

### 检查 Redis 数据

```bash
# 查看所有 OTP 相关键
redis-cli KEYS "otp:*"

# 查看特定 OTP
redis-cli GET "otp:email:register:test@example.com"

# 查看验证失败次数
redis-cli GET "otp:verify:register:test@example.com"

# 清除所有 OTP（如需重置测试）
redis-cli KEYS "otp:*" | xargs redis-cli DEL
```

### 检查数据库

```bash
cd /root/ccccckv/rocket-plan/backend

# 打开 Prisma Studio（可视化界面）
npx prisma studio
# 访问：http://localhost:5555

# 或直接查询
npx prisma db execute --stdin <<EOF
SELECT id, name, email, phone, googleId, createdAt 
FROM User 
ORDER BY createdAt DESC 
LIMIT 10;
EOF
```

---

## ✅ 测试检查清单

### 功能测试
- [ ] 邮箱注册成功
- [ ] 邮箱登录成功
- [ ] 手机号注册成功
- [ ] 手机号登录成功
- [ ] 邮箱重置密码成功
- [ ] 手机号重置密码成功
- [ ] Google OAuth 登录成功

### 安全测试
- [ ] OTP 验证次数限制（5次后锁定）
- [ ] OTP 用途隔离（注册 OTP 不能用于重置）
- [ ] 邮箱大小写标准化（不能创建重复账户）
- [ ] 大小写登录成功（TEST@X.COM = test@x.com）
- [ ] 发送频率限制（60秒内不能重复发送）
- [ ] Google 邮箱验证检查（未验证邮箱被拒绝）
- [ ] Token 使用 HTTPOnly Cookie（不在 URL 中）

### 边界测试
- [ ] 错误的验证码（提示：Invalid OTP）
- [ ] 过期的验证码（提示：OTP expired）
- [ ] 已注册的邮箱（提示：Email already registered）
- [ ] 已注册的手机号（提示：Phone number already registered）
- [ ] 不存在的账号登录（提示：Account not found）
- [ ] 错误的密码（提示：Invalid password）

---

## 🐛 常见问题排查

### 问题 1：收不到验证码

**排查步骤：**
```bash
# 1. 检查后端日志
tail -50 /tmp/rocket-plan-backend.log

# 2. 确认 Redis 连接
redis-cli ping

# 3. 检查是否有频率限制
redis-cli GET "otp:ratelimit:email:your-email@example.com"
```

### 问题 2：验证码总是提示过期

**可能原因：**
- Redis 未启动
- Redis 连接断开
- 系统时间不同步

**解决方案：**
```bash
# 重启 Redis
redis-cli shutdown
redis-server --daemonize yes

# 检查系统时间
date
```

### 问题 3：登录后跳转 401

**可能原因：**
- Token 未正确存储
- Cookie 配置问题
- CORS 配置问题

**排查：**
```bash
# 检查浏览器开发者工具
# Network → 查看请求头是否有 Authorization
# Application → Cookies → 查看是否有 token

# 检查后端 CORS 配置
cat backend/.env | grep FRONTEND_URL
```

---

## 📞 技术支持

如果遇到问题：

1. **查看完整日志：** `tail -100 /tmp/rocket-plan-backend.log`
2. **检查服务状态：** `./start.sh`
3. **重启服务：** `./stop.sh && ./start.sh`
4. **清理 Redis：** `redis-cli FLUSHDB`（⚠️ 会清除所有数据）

---

**祝测试顺利！** 🎉
