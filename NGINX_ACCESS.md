# Nginx 反向代理访问指南

## ✅ 配置完成

您的 Rocket Plan 现在通过 Nginx 反向代理 + HTTP Basic Auth 保护访问。

## 🌐 访问方式

### 浏览器访问

1. **打开浏览器访问**: http://YOUR_SERVER_IP
2. **输入认证信息**:
   - 用户名: `ccccckv`
   - 密码: `Ckw995920.`

### 命令行测试

```bash
# 测试健康检查（无需认证）
curl http://YOUR_SERVER_IP/health

# 测试前端（需要认证）
curl -u ccccckv:Ckw995920. http://YOUR_SERVER_IP/

# 测试后端 API（需要认证）
curl -u ccccckv:Ckw995920. http://YOUR_SERVER_IP/api/
```

## 📋 架构说明

```
浏览器 
  ↓ (HTTP Basic Auth)
Nginx (端口 80)
  ├─→ / → http://localhost:3001 (前端)
  └─→ /api/* → http://localhost:3002 (后端)
```

### 路径映射

| 访问路径 | 转发到 | 说明 |
|---------|--------|------|
| `/` | `localhost:3001` | Next.js 前端 |
| `/api/*` | `localhost:3002/*` | NestJS 后端（移除 /api 前缀） |
| `/health` | 直接返回 OK | 健康检查（无需认证） |
| `/_next/webpack-hmr` | `localhost:3001` | Next.js 热更新 |

### 配置文件

- **Nginx 配置**: `/etc/nginx/sites-available/rocket-plan`
- **认证文件**: `/etc/nginx/.htpasswd`
- **访问日志**: `/var/log/nginx/rocket-plan.access.log`
- **错误日志**: `/var/log/nginx/rocket-plan.error.log`

## 🔐 安全特性

✅ HTTP Basic Auth 认证保护  
✅ 不暴露内部端口 (3001, 3002)  
✅ 防火墙仅开放端口 80  
✅ 访问日志记录所有请求  

## 🛠️ 管理命令

### Nginx 管理

```bash
# 查看状态
sudo systemctl status nginx

# 重启服务
sudo systemctl restart nginx

# 重新加载配置（不中断服务）
sudo systemctl reload nginx

# 测试配置
sudo nginx -t

# 查看访问日志
sudo tail -f /var/log/nginx/rocket-plan.access.log

# 查看错误日志
sudo tail -f /var/log/nginx/rocket-plan.error.log
```

### 后端服务管理

```bash
cd /root/ccccckv/rocket-plan

# 启动后端
./start.sh

# 停止后端
./stop.sh

# 查看后端日志
tail -f /tmp/rocket-plan-backend.log
```

### 前端服务管理

```bash
# 停止前端
ps aux | grep "next dev" | grep -v grep | awk '{print $2}' | xargs -r kill

# 启动前端
cd /root/ccccckv/rocket-plan/frontend
nohup npm run dev > /tmp/rocket-plan-frontend.log 2>&1 &

# 查看前端日志
tail -f /tmp/rocket-plan-frontend.log
```

## 🔧 修改认证信息

### 修改密码

```bash
# 修改现有用户密码
sudo htpasswd /etc/nginx/.htpasswd ccccckv

# 添加新用户
sudo htpasswd /etc/nginx/.htpasswd newuser

# 删除用户
sudo htpasswd -D /etc/nginx/.htpasswd username

# 重启 Nginx 使配置生效
sudo systemctl restart nginx
```

### 临时禁用认证

编辑 `/etc/nginx/sites-available/rocket-plan`，注释掉这两行：

```nginx
# auth_basic "Rocket Plan - Restricted Access";
# auth_basic_user_file /etc/nginx/.htpasswd;
```

然后重启 Nginx：
```bash
sudo systemctl restart nginx
```

## 📊 监控与日志

### 实时监控访问

```bash
# 实时查看访问日志
sudo tail -f /var/log/nginx/rocket-plan.access.log

# 统计访问次数
sudo cat /var/log/nginx/rocket-plan.access.log | wc -l

# 查看失败的认证尝试
sudo grep "401" /var/log/nginx/rocket-plan.access.log
```

### 查看后端 OTP 验证码

```bash
cd /root/ccccckv/rocket-plan
./get-otp.sh
```

## ⚠️ 故障排查

### 问题 1: 访问提示 502 Bad Gateway

**原因**: 后端或前端服务未运行

**解决**:
```bash
# 检查服务状态
ps aux | grep -E "nest start|next dev" | grep -v grep

# 重启后端
cd /root/ccccckv/rocket-plan && ./stop.sh && ./start.sh

# 重启前端
ps aux | grep "next dev" | grep -v grep | awk '{print $2}' | xargs -r kill
cd /root/ccccckv/rocket-plan/frontend
nohup npm run dev > /tmp/rocket-plan-frontend.log 2>&1 &
```

### 问题 2: 认证一直失败

**检查认证文件**:
```bash
# 查看认证文件是否存在
sudo cat /etc/nginx/.htpasswd

# 重新创建用户
sudo htpasswd -c /etc/nginx/.htpasswd ccccckv
# 输入密码: Ckw995920.

# 重启 Nginx
sudo systemctl restart nginx
```

### 问题 3: API 请求失败

**检查前端配置**:
```bash
cat /root/ccccckv/rocket-plan/frontend/.env.local
# 应该显示: NEXT_PUBLIC_API_URL=/api
```

**检查后端是否运行**:
```bash
curl http://localhost:3002/
# 应该返回: Hello World!
```

### 问题 4: 端口 80 被占用

**查看占用端口的进程**:
```bash
sudo lsof -i :80
```

**停止冲突的服务**:
```bash
sudo systemctl stop apache2  # 如果是 Apache
sudo systemctl disable apache2
```

## 🚀 性能优化（可选）

### 启用 Gzip 压缩

编辑 `/etc/nginx/nginx.conf`，在 `http` 块中添加：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript;
```

### 增加连接限制

在 `server` 块中添加：

```nginx
limit_conn_zone $binary_remote_addr zone=addr:10m;
limit_conn addr 10;
```

### 配置缓存（生产环境）

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 📝 下一步

1. **测试注册流程**: 访问 http://YOUR_SERVER_IP/register
2. **获取验证码**: 在服务器执行 `./get-otp.sh`
3. **测试登录**: 访问 http://YOUR_SERVER_IP/login
4. **开发新功能**: 参考 [ARCHITECTURE.md](ARCHITECTURE.md)

## 🔗 相关文档

- [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) - 部署总结
- [ARCHITECTURE.md](ARCHITECTURE.md) - 系统架构
- [QUICK_START.md](QUICK_START.md) - 快速开始
