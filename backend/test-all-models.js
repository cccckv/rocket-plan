const axios = require('axios');
const FormData = require('form-data');

const models = [
  'veo3.1-fast-components',
  'veo_3_1-fast-components',
  'veo_3_1-fast',
  'veo_3_1-fast-4K',
  'veo3.1-fast',
  'veo3-fast',
  'veo3.1',
  'veo_3_1',
  'veo3.1-components',
  'veo_3_1-components',
  'veo3',
  'veo_3_1-4K',
  'veo_3_1-components-4K',
  'veo_3_1-fast-components-4K',
  'veo3.1-4k',
  'veo3.1-components-4k',
  'veo3-fast-frames',
  'veo3-frames',
  'veo3-pro-frames',
  'veo3.1-pro',
  'veo3.1-pro-4k',
];

async function testModel(model) {
  const apiKey = 'sk-L2rvHGMfzRjnvD2zD2yKfapiexUgxBWgAsNpbryMERtlY0BX';
  
  const formData = new FormData();
  formData.append('model', model);
  formData.append('prompt', 'A simple test scene');
  formData.append('duration', '4');
  formData.append('aspect_ratio', '16:9');
  formData.append('resolution', '720P');
  formData.append('enhance_prompt', 'false');
  formData.append('generate_audio', 'false');
  
  try {
    const response = await axios.post('https://aiapikey.ai/v1/videos', formData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...formData.getHeaders(),
      },
      timeout: 8000,
    });
    
    return {
      model,
      status: 'available',
      taskId: response.data.id,
      initialStatus: response.data.status,
    };
    
  } catch (error) {
    if (error.response) {
      const data = error.response.data;
      if (data.code === 'get_channel_failed' || data.message?.includes('负载已饱和')) {
        return { model, status: 'saturated', error: data.message };
      }
      return { model, status: 'error', error: data.message || data.code, statusCode: error.response.status };
    } else if (error.code === 'ECONNABORTED') {
      return { model, status: 'timeout' };
    } else {
      return { model, status: 'network_error', error: error.message };
    }
  }
}

async function testAllModels() {
  console.log('Testing all 21 Veo models...\n');
  
  const results = [];
  
  for (const model of models) {
    process.stdout.write(`Testing ${model}... `);
    const result = await testModel(model);
    results.push(result);
    
    if (result.status === 'available') {
      console.log('✅ AVAILABLE');
    } else if (result.status === 'saturated') {
      console.log('⚠️  SATURATED');
    } else if (result.status === 'error') {
      console.log(`❌ ERROR (${result.statusCode}): ${result.error?.substring(0, 50)}`);
    } else {
      console.log(`❌ ${result.status.toUpperCase()}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n=== SUMMARY ===\n');
  
  const available = results.filter(r => r.status === 'available');
  const saturated = results.filter(r => r.status === 'saturated');
  const errors = results.filter(r => r.status === 'error');
  const other = results.filter(r => !['available', 'saturated', 'error'].includes(r.status));
  
  console.log(`✅ Available (${available.length}):`);
  available.forEach(r => console.log(`   - ${r.model}`));
  
  console.log(`\n⚠️  Saturated (${saturated.length}):`);
  saturated.forEach(r => console.log(`   - ${r.model}`));
  
  console.log(`\n❌ Errors (${errors.length}):`);
  errors.forEach(r => console.log(`   - ${r.model}: ${r.error?.substring(0, 60)}`));
  
  if (other.length > 0) {
    console.log(`\n⚠️  Other Issues (${other.length}):`);
    other.forEach(r => console.log(`   - ${r.model}: ${r.status}`));
  }
  
  console.log('\n=== RECOMMENDATION ===');
  console.log('Keep only these models in the UI:');
  available.forEach(r => console.log(`  "${r.model}",`));
}

testAllModels().catch(console.error);
