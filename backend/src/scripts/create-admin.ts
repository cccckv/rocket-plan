import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { JwtService } from '@nestjs/jwt';

async function createAdmin() {
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL || 'file:./dev.db',
  });

  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$connect();

    console.log('\n👑 创建超级管理员用户\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@rocketplan.com' },
          { phone: '+86 138 8888 8888' },
        ],
      },
    });

    let admin;

    if (existingAdmin) {
      console.log('⚠️  管理员用户已存在，更新数据...\n');
      admin = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          email: 'admin@rocketplan.com',
          phone: '+86 138 8888 8888',
          tier: 'admin',
          credits: 999999,
        },
      });
    } else {
      console.log('✨ 创建新的管理员用户...\n');
      admin = await prisma.user.create({
        data: {
          email: 'admin@rocketplan.com',
          phone: '+86 138 8888 8888',
          tier: 'admin',
          credits: 999999,
        },
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
    const jwtService = new JwtService({
      secret: jwtSecret,
      signOptions: { expiresIn: '30d' },
    });

    const payload = {
      sub: admin.id,
      phone: admin.phone,
      email: admin.email,
    };

    const accessToken = jwtService.sign(payload);

    console.log('✅ 超级管理员创建成功！\n');
    console.log('───────────────────────────────────────────────────────────\n');
    console.log(`👤 用户信息:`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   邮箱: ${admin.email}`);
    console.log(`   手机: ${admin.phone}`);
    console.log(`   等级: ${admin.tier.toUpperCase()} 👑`);
    console.log(`   积分: ${admin.credits.toLocaleString()} (无限)`);
    console.log(`\n🎫 Access Token (有效期 30 天):`);
    console.log(`   ${accessToken}\n`);
    console.log('───────────────────────────────────────────────────────────\n');
    console.log('🚀 登录方式:\n');
    console.log('方式 1: 使用演示登录页 (需要更新)');
    console.log('   访问: http://localhost:3001/demo-login.html\n');
    console.log('方式 2: 浏览器控制台手动登录');
    console.log('   1. 访问: http://localhost:3001/zh/dashboard');
    console.log('   2. 打开控制台 (F12)');
    console.log('   3. 运行以下代码:\n');
    console.log(`   localStorage.setItem('accessToken', '${accessToken}');`);
    console.log(`   localStorage.setItem('user_info', JSON.stringify({`);
    console.log(`     id: ${admin.id},`);
    console.log(`     email: '${admin.email}',`);
    console.log(`     tier: 'ADMIN',`);
    console.log(`     credits: ${admin.credits}`);
    console.log(`   }));`);
    console.log(`   location.reload();\n`);
    console.log('方式 3: 测试 API');
    console.log(`   curl -H "Authorization: Bearer ${accessToken}" http://localhost:3000/auth/me\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

    await prisma.$disconnect();

    return {
      admin,
      token: accessToken,
    };

  } catch (error) {
    console.error('❌ 错误:', error);
    await prisma.$disconnect();
    throw error;
  }
}

createAdmin()
  .then((result) => {
    console.log('✨ 管理员账号已就绪！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('创建失败:', error);
    process.exit(1);
  });
