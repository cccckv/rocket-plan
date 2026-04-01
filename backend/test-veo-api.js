const axios = require('axios');
const FormData = require('form-data');

async function testVeoAPI() {
  const apiKey = 'sk-L2rvHGMfzRjnvD2zD2yKfapiexUgxBWgAsNpbryMERtlY0BX';
  
  // Test with the cheapest non-Gemini model first
  const models = [
    'veo3.1-fast-components',
    'veo_3_1-fast',
    'veo3.1-fast',
  ];
  
  for (const model of models) {
    console.log(`\n=== Testing ${model} ===`);
    
    const formData = new FormData();
    formData.append('model', model);
    formData.append('prompt', 'A peaceful lake at sunset with mountains in the background');
    formData.append('duration', '5');
    formData.append('aspect_ratio', '16:9');
    formData.append('resolution', '720P');
    formData.append('enhance_prompt', 'true');
    formData.append('generate_audio', 'true');
    
    try {
      const response = await axios.post('https://aiapikey.ai/v1/videos', formData, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...formData.getHeaders(),
        },
        timeout: 10000,
      });
      
      console.log(`✅ ${model} - SUCCESS`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return; // Stop after first success
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${model} - API Error ${error.response.status}`);
        console.log('Error data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.code === 'ECONNABORTED') {
        console.log(`❌ ${model} - Timeout`);
      } else {
        console.log(`❌ ${model} - Network Error: ${error.message}`);
      }
    }
  }
  
  console.log('\n⚠️  All models failed or saturated');
}

testVeoAPI().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
