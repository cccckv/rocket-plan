const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();
  
  try {
    const userCount = await prisma.user.count();
    console.log('✅ 数据库连接成功');
    console.log(`📊 用户数量: ${userCount}`);
    
    const videoCount = await prisma.video.count();
    console.log(`📊 视频数量: ${videoCount}`);
    
    const bgmCount = await prisma.bGM.count();
    console.log(`📊 BGM 数量: ${bgmCount}`);
    
    const templateCount = await prisma.template.count();
    console.log(`📊 模板数量: ${templateCount}`);
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
