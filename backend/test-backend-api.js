const axios = require('axios');

async function testBackendAPI() {
  const baseURL = 'http://localhost:3002';
  
  // Step 1: Login to get token
  console.log('\n=== Step 1: Login ===');
  let token;
  try {
    const loginRes = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'ccckvi@outlook.com',
      password: 'Asdf1234',
    });
    token = loginRes.data.accessToken || loginRes.data.token;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 20) + '...');
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    process.exit(1);
  }
  
  // Step 2: Check credits
  console.log('\n=== Step 2: Check Credits ===');
  try {
    const creditsRes = await axios.get(`${baseURL}/api/credits/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✅ Current balance:', creditsRes.data.credits, 'credits');
  } catch (error) {
    console.error('❌ Credits check failed:', error.response?.data || error.message);
  }
  
  // Step 3: Create video task with working model
  console.log('\n=== Step 3: Create Video Task ===');
  let taskId;
  try {
    const createRes = await axios.post(`${baseURL}/api/videos/generate`, {
      type: 'text-to-video',
      model: 'veo3.1-fast',
      prompt: 'A peaceful lake at sunset with mountains in the background',
      duration: 5,
      aspectRatio: '16:9',
      resolution: '720P',
      enhancePrompt: true,
      generateAudio: true,
    }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    taskId = createRes.data.id;
    console.log('✅ Task created successfully');
    console.log('Task ID:', taskId);
    console.log('Status:', createRes.data.status);
  } catch (error) {
    console.error('❌ Task creation failed:', error.response?.data || error.message);
    process.exit(1);
  }
  
  // Step 4: Poll task status
  console.log('\n=== Step 4: Poll Task Status ===');
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const pollRes = await axios.post(`${baseURL}/api/videos/tasks/${taskId}/poll`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const status = pollRes.data.status;
      console.log(`[${attempts}] Status: ${status}`);
      
      if (status === 'completed') {
        console.log('\n✅ Video generation completed!');
        console.log('Result URL:', pollRes.data.resultUrl);
        console.log('Local path:', pollRes.data.localPath);
        break;
      }
      
      if (status === 'failed') {
        console.log('\n❌ Video generation failed');
        console.log('Error:', pollRes.data.errorMsg);
        break;
      }
      
      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error('❌ Polling error:', error.response?.data || error.message);
      break;
    }
  }
  
  if (attempts >= maxAttempts) {
    console.log('\n⚠️  Timeout: Task did not complete within 5 minutes');
  }
  
  // Step 5: Check final credits
  console.log('\n=== Step 5: Final Credits Check ===');
  try {
    const creditsRes = await axios.get(`${baseURL}/api/credits/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✅ Final balance:', creditsRes.data.credits, 'credits');
  } catch (error) {
    console.error('❌ Credits check failed:', error.response?.data || error.message);
  }
}

testBackendAPI().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
