import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as path from 'path';

// Create adapter for SQLite
const adapter = new PrismaLibSql({
  url: `file:${path.join(__dirname, '..', 'dev.db')}`,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 清空现有数据（开发环境）
  await prisma.transaction.deleteMany();
  await prisma.videoMaterial.deleteMany();
  await prisma.script.deleteMany();
  await prisma.video.deleteMany();
  await prisma.material.deleteMany();
  await prisma.template.deleteMany();
  await prisma.bGM.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // ========== 1. 创建测试用户 ==========
  const users = await Promise.all([
    // 免费用户
    prisma.user.create({
      data: {
        phone: '+86 138 0000 0001',
        email: 'free@example.com',
        credits: 2,
        tier: 'free',
      },
    }),
    // 基础版用户
    prisma.user.create({
      data: {
        phone: '+86 138 0000 0002',
        email: 'basic@example.com',
        credits: 20,
        tier: 'basic',
      },
    }),
    // 专业版用户
    prisma.user.create({
      data: {
        phone: '+86 138 0000 0003',
        email: 'pro@example.com',
        googleId: 'google_pro_123',
        credits: 100,
        tier: 'pro',
      },
    }),
    // Google 登录用户
    prisma.user.create({
      data: {
        googleId: 'google_test_456',
        email: 'google@example.com',
        credits: 2,
        tier: 'free',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} test users`);

  // ========== 2. 创建 BGM 音乐 ==========
  const bgms = await Promise.all([
    // Upbeat 类别
    prisma.bGM.create({
      data: {
        name: 'Happy Summer Day',
        fileUrl: 'https://pixabay.com/music/upbeat/happy-summer-day.mp3',
        s3Key: 'bgm/happy-summer-day.mp3',
        duration: 180,
        category: 'upbeat',
        license: 'Pixabay License',
      },
    }),
    prisma.bGM.create({
      data: {
        name: 'Energetic Rock',
        fileUrl: 'https://pixabay.com/music/upbeat/energetic-rock.mp3',
        s3Key: 'bgm/energetic-rock.mp3',
        duration: 165,
        category: 'upbeat',
        license: 'Pixabay License',
      },
    }),
    prisma.bGM.create({
      data: {
        name: 'Fun Beat',
        fileUrl: 'https://pixabay.com/music/upbeat/fun-beat.mp3',
        s3Key: 'bgm/fun-beat.mp3',
        duration: 150,
        category: 'upbeat',
        license: 'Pixabay License',
      },
    }),

    // Calm 类别
    prisma.bGM.create({
      data: {
        name: 'Peaceful Piano',
        fileUrl: 'https://pixabay.com/music/calm/peaceful-piano.mp3',
        s3Key: 'bgm/peaceful-piano.mp3',
        duration: 200,
        category: 'calm',
        license: 'Pixabay License',
      },
    }),
    prisma.bGM.create({
      data: {
        name: 'Ambient Dreams',
        fileUrl: 'https://pixabay.com/music/calm/ambient-dreams.mp3',
        s3Key: 'bgm/ambient-dreams.mp3',
        duration: 195,
        category: 'calm',
        license: 'Pixabay License',
      },
    }),

    // Dramatic 类别
    prisma.bGM.create({
      data: {
        name: 'Epic Cinematic',
        fileUrl: 'https://pixabay.com/music/dramatic/epic-cinematic.mp3',
        s3Key: 'bgm/epic-cinematic.mp3',
        duration: 175,
        category: 'dramatic',
        license: 'Pixabay License',
      },
    }),
    prisma.bGM.create({
      data: {
        name: 'Intense Action',
        fileUrl: 'https://pixabay.com/music/dramatic/intense-action.mp3',
        s3Key: 'bgm/intense-action.mp3',
        duration: 160,
        category: 'dramatic',
        license: 'Pixabay License',
      },
    }),
  ]);

  console.log(`✅ Created ${bgms.length} BGM tracks`);

  // ========== 3. 创建视频模板 ==========
  const templates = await Promise.all([
    // 家具类别
    prisma.template.create({
      data: {
        name: 'Modern Furniture Showcase',
        category: 'furniture',
        thumbnailUrl: 'https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=Modern+Furniture',
        configJson: JSON.stringify({
          transitions: ['fade', 'slide'],
          textStyle: 'modern-sans',
          textPosition: 'bottom-center',
          colors: {
            primary: '#4A90E2',
            secondary: '#F5A623',
            text: '#FFFFFF',
          },
          effectSpeed: 'medium',
        }),
      },
    }),
    prisma.template.create({
      data: {
        name: 'Minimalist Home',
        category: 'furniture',
        thumbnailUrl: 'https://via.placeholder.com/400x300/2ECC71/FFFFFF?text=Minimalist+Home',
        configJson: JSON.stringify({
          transitions: ['zoom', 'fade'],
          textStyle: 'clean-serif',
          textPosition: 'top-left',
          colors: {
            primary: '#2ECC71',
            secondary: '#95A5A6',
            text: '#2C3E50',
          },
          effectSpeed: 'slow',
        }),
      },
    }),

    // 电子产品类别
    prisma.template.create({
      data: {
        name: 'Tech Product Launch',
        category: 'electronics',
        thumbnailUrl: 'https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=Tech+Launch',
        configJson: JSON.stringify({
          transitions: ['glitch', 'wipe'],
          textStyle: 'futuristic',
          textPosition: 'center',
          colors: {
            primary: '#9B59B6',
            secondary: '#3498DB',
            text: '#ECF0F1',
          },
          effectSpeed: 'fast',
        }),
      },
    }),
    prisma.template.create({
      data: {
        name: 'Gadget Showcase',
        category: 'electronics',
        thumbnailUrl: 'https://via.placeholder.com/400x300/E74C3C/FFFFFF?text=Gadget',
        configJson: JSON.stringify({
          transitions: ['slide', 'zoom'],
          textStyle: 'bold-sans',
          textPosition: 'bottom-right',
          colors: {
            primary: '#E74C3C',
            secondary: '#F39C12',
            text: '#FFFFFF',
          },
          effectSpeed: 'medium',
        }),
      },
    }),

    // 时尚类别
    prisma.template.create({
      data: {
        name: 'Fashion Elegance',
        category: 'fashion',
        thumbnailUrl: 'https://via.placeholder.com/400x300/E91E63/FFFFFF?text=Fashion',
        configJson: JSON.stringify({
          transitions: ['fade', 'slide'],
          textStyle: 'elegant-script',
          textPosition: 'top-center',
          colors: {
            primary: '#E91E63',
            secondary: '#FFC107',
            text: '#212121',
          },
          effectSpeed: 'slow',
        }),
      },
    }),
    prisma.template.create({
      data: {
        name: 'Street Style',
        category: 'fashion',
        thumbnailUrl: 'https://via.placeholder.com/400x300/607D8B/FFFFFF?text=Street+Style',
        configJson: JSON.stringify({
          transitions: ['cut', 'glitch'],
          textStyle: 'urban-graffiti',
          textPosition: 'bottom-left',
          colors: {
            primary: '#607D8B',
            secondary: '#FF5722',
            text: '#FAFAFA',
          },
          effectSpeed: 'fast',
        }),
      },
    }),

    // 通用模板
    prisma.template.create({
      data: {
        name: 'Universal Product Ad',
        category: 'general',
        thumbnailUrl: 'https://via.placeholder.com/400x300/34495E/FFFFFF?text=Universal',
        configJson: JSON.stringify({
          transitions: ['fade', 'zoom'],
          textStyle: 'standard-sans',
          textPosition: 'center',
          colors: {
            primary: '#34495E',
            secondary: '#1ABC9C',
            text: '#ECEFF1',
          },
          effectSpeed: 'medium',
        }),
      },
    }),
  ]);

  console.log(`✅ Created ${templates.length} video templates`);

  // ========== 4. 创建示例素材 ==========
  const materials = await Promise.all([
    prisma.material.create({
      data: {
        userId: users[2].id, // Pro user
        type: 'image',
        s3Url: 'https://via.placeholder.com/1920x1080/3498DB/FFFFFF?text=Demo+Image+1',
        s3Key: 'materials/demo-image-1.jpg',
        size: 256000,
      },
    }),
    prisma.material.create({
      data: {
        userId: users[2].id,
        type: 'video',
        s3Url: 'https://via.placeholder.com/1920x1080/E74C3C/FFFFFF?text=Demo+Video+1',
        s3Key: 'materials/demo-video-1.mp4',
        size: 5120000,
        duration: 10,
      },
    }),
  ]);

  console.log(`✅ Created ${materials.length} demo materials`);

  // ========== 5. 创建示例交易记录 ==========
  const transactions = await Promise.all([
    // 基础版用户充值
    prisma.transaction.create({
      data: {
        userId: users[1].id,
        amount: 20,
        type: 'purchase',
      },
    }),
    // 专业版用户充值
    prisma.transaction.create({
      data: {
        userId: users[2].id,
        amount: 100,
        type: 'purchase',
      },
    }),
    // 专业版用户消费
    prisma.transaction.create({
      data: {
        userId: users[2].id,
        amount: -1,
        type: 'consume',
      },
    }),
  ]);

  console.log(`✅ Created ${transactions.length} transactions`);

  // ========== 总结 ==========
  console.log('\n🎉 Database seeding completed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Summary:`);
  console.log(`   👥 Users: ${users.length}`);
  console.log(`   🎵 BGMs: ${bgms.length}`);
  console.log(`   🎨 Templates: ${templates.length}`);
  console.log(`   📦 Materials: ${materials.length}`);
  console.log(`   💰 Transactions: ${transactions.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
