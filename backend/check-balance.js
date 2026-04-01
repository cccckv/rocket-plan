const { PrismaClient } = require('@prisma/client');

async function checkBalance() {
  const prisma = new PrismaClient();
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: 13 },
      select: { 
        id: true, 
        email: true, 
        credits: true 
      }
    });
    
    console.log('User:', user);
    
    const transactions = await prisma.transaction.findMany({
      where: { userId: 13 },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        type: true,
        createdAt: true,
        videoId: true
      }
    });
    
    console.log('\nRecent transactions:');
    transactions.forEach(t => {
      console.log(`  ${t.createdAt.toISOString()} | ${t.type} | ${t.amount} | Video: ${t.videoId || 'N/A'}`);
    });
    
    const totalConsumed = transactions
      .filter(t => t.type === 'consume')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalRefunded = transactions
      .filter(t => t.type === 'refund')
      .reduce((sum, t) => sum + t.amount, 0);
      
    console.log(`\nTotal consumed: ${totalConsumed}`);
    console.log(`Total refunded: ${totalRefunded}`);
    console.log(`Net consumed: ${totalConsumed - totalRefunded}`);
    
  } finally {
    await prisma.$disconnect();
  }
}

checkBalance().catch(console.error);
