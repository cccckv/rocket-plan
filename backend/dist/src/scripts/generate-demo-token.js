"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const adapter_libsql_1 = require("@prisma/adapter-libsql");
async function generateDemoToken() {
    const adapter = new adapter_libsql_1.PrismaLibSql({
        url: process.env.DATABASE_URL || 'file:./dev.db',
    });
    const prisma = new client_1.PrismaClient({ adapter });
    try {
        await prisma.$connect();
        const users = await prisma.user.findMany({
            select: {
                id: true,
                phone: true,
                email: true,
                googleId: true,
                tier: true,
                credits: true,
            },
        });
        if (users.length === 0) {
            console.log('❌ No users found in database');
            return;
        }
        console.log('\n🔐 生成演示登录令牌\n');
        console.log('═══════════════════════════════════════════════════════════\n');
        const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
        const jwtService = new jwt_1.JwtService({
            secret: jwtSecret,
            signOptions: { expiresIn: '7d' },
        });
        for (const user of users) {
            const payload = {
                sub: user.id,
                phone: user.phone,
                email: user.email,
            };
            const accessToken = jwtService.sign(payload);
            const userName = user.email || user.phone || user.googleId || `User ${user.id}`;
            console.log(`👤 用户: ${userName}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   等级: ${user.tier.toUpperCase()}`);
            console.log(`   积分: ${user.credits}`);
            console.log(`   手机: ${user.phone || '未设置'}`);
            console.log(`   邮箱: ${user.email || '未设置'}`);
            console.log(`\n   🎫 Access Token:`);
            console.log(`   ${accessToken}`);
            console.log('\n   使用方法:');
            console.log(`   curl -H "Authorization: Bearer ${accessToken}" http://localhost:3000/auth/me\n`);
            console.log('───────────────────────────────────────────────────────────\n');
        }
        console.log('💡 提示:');
        console.log('   1. 复制上面的 Access Token');
        console.log('   2. 在浏览器控制台运行:');
        console.log('      localStorage.setItem("access_token", "你的token")');
        console.log('   3. 刷新页面即可以登录状态访问\n');
        console.log('═══════════════════════════════════════════════════════════\n');
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
generateDemoToken();
//# sourceMappingURL=generate-demo-token.js.map