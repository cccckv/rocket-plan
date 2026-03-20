const fs = require('fs');
const path = require('path');

console.log('=== Rocket Plan 功能测试 ===\n');

// 1. 检查数据库文件
const dbPath = path.join(__dirname, 'dev.db');
if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath);
  console.log('✅ 数据库文件存在');
  console.log(`   大小: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`   修改时间: ${stats.mtime.toLocaleString('zh-CN')}`);
} else {
  console.log('❌ 数据库文件不存在');
}

// 2. 检查构建输出
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('\n✅ 后端构建成功');
  const files = fs.readdirSync(distPath);
  console.log(`   输出文件数: ${files.length}`);
} else {
  console.log('\n❌ 后端构建输出不存在');
}

// 3. 检查uploads目录
const uploadsPath = path.join(__dirname, 'uploads');
if (fs.existsSync(uploadsPath)) {
  console.log('\n✅ 上传目录存在');
  const folders = fs.readdirSync(uploadsPath);
  console.log(`   子目录: ${folders.join(', ')}`);
} else {
  console.log('\n❌ 上传目录不存在');
}

// 4. 检查环境变量配置
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n').filter(l => l && !l.startsWith('#'));
  console.log('\n✅ 环境变量文件存在');
  console.log(`   已配置变量数: ${lines.length}`);
  
  const hasJwt = envContent.includes('JWT_SECRET');
  const hasRedis = envContent.includes('REDIS_HOST');
  const hasStorage = envContent.includes('STORAGE_PROVIDER');
  
  console.log(`   JWT 配置: ${hasJwt ? '✅' : '❌'}`);
  console.log(`   Redis 配置: ${hasRedis ? '✅' : '❌'}`);
  console.log(`   存储配置: ${hasStorage ? '✅' : '❌'}`);
} else {
  console.log('\n❌ 环境变量文件不存在');
}

// 5. 检查模块文件
const modules = ['auth', 'storage', 'prisma'];
console.log('\n模块检查:');
modules.forEach(mod => {
  const modPath = path.join(__dirname, 'src', mod);
  if (fs.existsSync(modPath)) {
    const files = fs.readdirSync(modPath).filter(f => f.endsWith('.ts'));
    console.log(`   ${mod}: ✅ (${files.length} 个文件)`);
  } else {
    console.log(`   ${mod}: ❌`);
  }
});

console.log('\n=== 测试完成 ===');
