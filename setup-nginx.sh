#!/bin/bash

echo "=== Rocket Plan Nginx 配置向导 ==="
echo

# 1. 创建认证文件
echo "步骤 1: 创建 HTTP Basic Auth 认证"
echo "请输入用户名和密码（用于访问网站）"
echo
sudo htpasswd -c /etc/nginx/.htpasswd rocketuser

if [ $? -ne 0 ]; then
    echo "❌ 创建密码文件失败"
    exit 1
fi

echo
echo "✅ 认证文件创建成功"
echo

# 2. 备份现有配置
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "步骤 2: 备份现有 Nginx 配置"
    sudo mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup
    echo "✅ 已备份到 /etc/nginx/sites-enabled/default.backup"
fi

# 3. 创建 Rocket Plan 配置
echo
echo "步骤 3: 创建 Rocket Plan Nginx 配置"

sudo tee /etc/nginx/sites-available/rocket-plan > /dev/null << 'EOF'
# Rocket Plan Nginx 配置
# 通过 HTTP Basic Auth 保护访问

upstream frontend {
    server localhost:3001;
}

upstream backend {
    server localhost:3002;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # 访问日志
    access_log /var/log/nginx/rocket-plan.access.log;
    error_log /var/log/nginx/rocket-plan.error.log;

    # HTTP Basic Auth 认证
    auth_basic "Rocket Plan - Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;

    # 增加超时时间（用于开发环境的 HMR）
    proxy_connect_timeout 600;
    proxy_send_timeout 600;
    proxy_read_timeout 600;
    send_timeout 600;

    # WebSocket 支持（Next.js HMR）
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;

    # 后端 API
    location /api/ {
        # API 使用 JWT 认证，禁用 HTTP Basic Auth
        auth_basic off;
        
        # 移除 /api 前缀并转发到后端
        rewrite ^/api/(.*)$ /$1 break;
        
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS 头（如果需要）
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        add_header Access-Control-Allow-Credentials true always;
    }

    # 前端（所有其他请求）
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js 开发服务器特殊路径
    location /_next/webpack-hmr {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 健康检查（不需要认证）
    location /health {
        auth_basic off;
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
EOF

echo "✅ 配置文件已创建: /etc/nginx/sites-available/rocket-plan"

# 4. 启用配置
echo
echo "步骤 4: 启用配置"
sudo ln -sf /etc/nginx/sites-available/rocket-plan /etc/nginx/sites-enabled/rocket-plan

# 5. 测试配置
echo
echo "步骤 5: 测试 Nginx 配置"
sudo nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx 配置测试失败"
    exit 1
fi

echo "✅ 配置测试通过"

# 6. 重启 Nginx
echo
echo "步骤 6: 重启 Nginx"
sudo systemctl restart nginx

if [ $? -ne 0 ]; then
    echo "❌ Nginx 重启失败"
    sudo systemctl status nginx
    exit 1
fi

echo "✅ Nginx 已重启"

# 7. 检查防火墙
echo
echo "步骤 7: 检查防火墙配置"
if sudo ufw status | grep -q "Status: active"; then
    echo "UFW 防火墙已启用，开放端口 80..."
    sudo ufw allow 80/tcp
    echo "✅ 端口 80 已开放"
else
    echo "ℹ️  UFW 防火墙未启用"
fi

# 8. 输出访问信息
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Nginx 配置完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "📍 访问地址:"
echo "   http://YOUR_SERVER_IP"
echo
echo "🔐 认证信息:"
echo "   用户名: rocketuser"
echo "   密码: （刚才设置的密码）"
echo
echo "🧪 测试访问:"
echo "   curl -u rocketuser:YOUR_PASSWORD http://YOUR_SERVER_IP"
echo
echo "📝 查看日志:"
echo "   sudo tail -f /var/log/nginx/rocket-plan.access.log"
echo "   sudo tail -f /var/log/nginx/rocket-plan.error.log"
echo
echo "🔧 管理命令:"
echo "   sudo systemctl status nginx   # 查看状态"
echo "   sudo systemctl restart nginx  # 重启"
echo "   sudo nginx -t                 # 测试配置"
echo
echo "⚠️  重要："
echo "   - 前端仍然运行在 localhost:3001"
echo "   - 后端仍然运行在 localhost:3002"
echo "   - Nginx 在端口 80 提供反向代理和认证"
echo "   - 访问 http://YOUR_SERVER_IP 会要求输入用户名密码"
echo
