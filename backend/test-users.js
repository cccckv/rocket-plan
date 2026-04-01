const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const path = require('path');

const adapter = new PrismaLibSql({
  url: `file:${path.join(__dirname, 'dev.db')}`,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    take: 5,
    select: {
      email: true,
      name: true,
      credits: true,
      tier: true,
      password: true
    }
  });
  
  console.log('Seeded users:');
  users.forEach(user => {
    console.log(`- ${user.email} (${user.name}) - ${user.credits} credits, ${user.tier} tier - Has password: ${!!user.password}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
