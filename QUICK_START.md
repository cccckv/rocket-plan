# Rocket Plan 快速启动指南

## 🚀 一键启动

```bash
cd /root/ccccckv/rocket-plan
./start.sh
```

## 📍 访问地址

**后端 API**: http://localhost:3002

## 🧪 快速测试

```bash
# 测试连接
curl http://localhost:3002/

# 登录获取 Token
curl -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"demo@test.com","password":"Test123456"}'

# 访问受保护端点
curl http://localhost:3002/auth/me \
  -H "Authorization: Bearer <your_token>"
```

## 🛑 停止服务

```bash
./stop.sh
```

## 📊 查看日志

```bash
tail -f /tmp/rocket-plan-backend.log
```

## ⚙️ 端口配置

- **后端**: 3002 (避免与端口 3000 冲突)
- **Redis**: 6379
- **Prisma Studio**: 5555

详细配置: `PORT_CONFIGURATION.md`

## 🔑 测试账号

- **邮箱**: demo@test.com
- **密码**: Test123456

## 📖 完整文档

- `DEPLOYMENT_SUMMARY.md` - 部署详情
- `ARCHITECTURE.md` - 技术架构
- `PORT_CONFIGURATION.md` - 端口配置

---

**状态**: ✅ 运行中  
**端口**: 3002  
**最后更新**: 2026-03-22
