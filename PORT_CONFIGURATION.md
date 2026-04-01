# Rocket Plan 端口配置

## 当前端口分配

| 服务 | 端口 | 状态 | 说明 |
|------|------|------|------|
| **Rocket Plan Backend** | **3002** | ✅ 运行中 | NestJS 后端 API |
| Prisma Studio | 5555 | ⚠️ 可选 | 数据库可视化工具 |
| Redis | 6379 | ✅ 运行中 | 缓存和会话存储 |
| Frontend (未实现) | 3001 | ❌ | Next.js 前端（待开发） |

## 端口 3000 冲突说明

**问题**: 端口 3000 已被其他服务占用 (PID: 171717)

**解决方案**: Rocket Plan 后端已更改为使用端口 **3002**

## 访问地址

### 后端 API
```
http://localhost:3002
```

### 主要端点
```bash
# 测试连接
curl http://localhost:3002/

# 认证
POST http://localhost:3002/auth/login
POST http://localhost:3002/auth/register
GET  http://localhost:3002/auth/me

# 存储
POST http://localhost:3002/storage/upload/:folder
GET  http://localhost:3002/storage/signed-url/*key
```

## 修改端口

如果需要更改端口，编辑以下文件：

### 1. 环境变量配置
**文件**: `backend/.env`
```bash
PORT="3002"  # 修改为你想要的端口
GOOGLE_CALLBACK_URL="http://localhost:3002/auth/google/callback"
```

### 2. 启动脚本
**文件**: `start.sh`
```bash
# 搜索并替换所有 3002 为新端口
sed -i 's/3002/YOUR_PORT/g' start.sh
```

### 3. 重启服务
```bash
./stop.sh
./start.sh
```

## 端口检查命令

```bash
# 查看端口占用
lsof -i:3002
netstat -tulpn | grep 3002

# 查看所有监听端口
ss -tulpn | grep LISTEN

# 查看 Rocket Plan 进程
ps aux | grep "nest start"
```

## 防火墙配置（生产环境）

如果在生产环境部署，需要开放端口：

```bash
# UFW
sudo ufw allow 3002/tcp

# iptables
sudo iptables -A INPUT -p tcp --dport 3002 -j ACCEPT

# firewalld
sudo firewall-cmd --permanent --add-port=3002/tcp
sudo firewall-cmd --reload
```

## 注意事项

1. ⚠️ **端口 3000 保留**: 请勿使用，已被其他服务占用
2. ✅ **当前端口 3002**: Rocket Plan 后端运行端口
3. 📝 **CORS 配置**: 后端已启用 CORS，允许跨域访问
4. 🔒 **生产环境**: 建议使用反向代理（Nginx）而不是直接暴露端口

## 故障排查

### 端口冲突
```bash
# 查找占用端口的进程
lsof -ti:3002

# 强制终止占用端口的进程
lsof -ti:3002 | xargs kill -9
```

### 服务无法启动
```bash
# 检查端口是否被占用
netstat -tulpn | grep 3002

# 查看后端日志
tail -f /tmp/rocket-plan-backend.log

# 检查环境变量
cat backend/.env | grep PORT
```

---

**最后更新**: 2026-03-22  
**配置状态**: ✅ 端口冲突已解决，服务运行在 3002
