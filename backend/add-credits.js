const { PrismaClient } = require('@prisma/client');

async function addCredits() {
  const prisma = new PrismaClient();
  
  try {
    const email = 'ccccckv@outlook.com';
    const amount = 100;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, credits: true }
    });
    
    if (!user) {
      console.error('User not found:', email);
      process.exit(1);
    }
    
    console.log('Before:', user.credits, 'credits');
    
    // Add credits
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: {
          increment: amount
        }
      },
      select: { credits: true }
    });
    
    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: amount,
        type: 'admin_adjust',
      }
    });
    
    console.log('After:', updatedUser.credits, 'credits');
    console.log(`✅ Added ${amount} credits to ${email}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addCredits();
