const axios = require('axios');

async function testRefund() {
  const baseURL = 'http://localhost:3002';
  
  // Login
  const loginRes = await axios.post(`${baseURL}/auth/login`, {
    account: 'ccckvi@outlook.com',
    password: '123456',
  });
  const token = loginRes.data.accessToken;
  
  // Check initial balance
  const beforeBalance = await axios.get(`${baseURL}/credits/balance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Initial balance:', beforeBalance.data.credits);
  
  // Create task that will likely fail
  const createRes = await axios.post(`${baseURL}/api/videos/generate`, {
    type: 'text-to-video',
    model: 'veo3.1-fast',
    prompt: 'Test refund: a simple scene',
    duration: 4,
    aspectRatio: '16:9',
    resolution: '720P',
    enhancePrompt: false,
    generateAudio: false,
  }, {
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const taskId = createRes.data.id;
  console.log('Task created:', taskId);
  
  //Check balance after deduction
  const afterDeduct = await axios.get(`${baseURL}/credits/balance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('After deduction:', afterDeduct.data.credits);
  
  // Poll until failed
  for (let i = 0; i < 20; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const pollRes = await axios.post(`${baseURL}/api/videos/tasks/${taskId}/poll`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log(`[${i+1}] Status: ${pollRes.data.status}`);
    
    if (pollRes.data.status === 'failed') {
      console.log('Task failed:', pollRes.data.errorMsg?.substring(0, 100));
      break;
    }
    
    if (pollRes.data.status === 'completed') {
      console.log('Task completed (unexpected)');
      return;
    }
  }
  
  // Wait for refund to process
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check final balance
  const finalBalance = await axios.get(`${baseURL}/credits/balance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Final balance:', finalBalance.data.credits);
  
  // Check transactions
  const txRes = await axios.get(`${baseURL}/credits/transactions?limit=3`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  console.log('\nRecent transactions:');
  txRes.data.transactions.forEach(tx => {
    console.log(`  ${tx.type}: ${tx.amount} credits`);
  });
}

testRefund().catch(console.error);
