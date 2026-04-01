const axios = require('axios');

async function quickTest() {
  const baseURL = 'http://localhost:3002';
  
  // Login
  const loginRes = await axios.post(`${baseURL}/auth/login`, {
    account: 'ccckvi@outlook.com',
    password: '123456',
  });
  const token = loginRes.data.accessToken || loginRes.data.token;
  console.log('✅ Logged in');
  
  // Create task with simpler prompt and shorter duration
  const createRes = await axios.post(`${baseURL}/api/videos/generate`, {
    type: 'text-to-video',
    model: 'veo3.1-fast',
    prompt: 'A red apple on a white table',
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
  console.log('✅ Task created:', taskId);
  
  // Poll for 3 minutes
  for (let i = 0; i < 36; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const pollRes = await axios.post(`${baseURL}/api/videos/tasks/${taskId}/poll`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log(`[${i+1}] ${pollRes.data.status} - ${pollRes.data.progress || 0}%`);
    
    if (pollRes.data.status === 'completed') {
      console.log('\n✅ SUCCESS!');
      console.log('Video URL:', pollRes.data.resultUrl);
      console.log('Local path:', pollRes.data.localPath);
      return;
    }
    
    if (pollRes.data.status === 'failed') {
      console.log('\n❌ FAILED:', pollRes.data.errorMsg);
      return;
    }
  }
  
  console.log('\n⏱️  Still processing after 3 minutes...');
}

quickTest().catch(console.error);
