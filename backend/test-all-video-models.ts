#!/usr/bin/env ts-node
import axios from 'axios';
import FormData from 'form-data';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE_URL = process.env.AIAPIKEY_BASE_URL || 'https://aiapikey.ai';
const API_KEY = process.env.AIAPIKEY_API_KEY;

const VIDEO_MODELS = [
  'grok-video',
  'grok-video-2',
  'kling-v1.6',
  'kling-v1.6-pro',
  'hunyuan-video',
  'minimax-video-01',
  'luma-ray-v2',
  'runway-gen3',
];

const ENDPOINTS = ['/v1/videos', '/v1/video/create'];

async function testModelEndpoint(model: string, endpoint: string) {
  try {
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', 'A test video prompt');

    const response = await axios.post(`${API_BASE_URL}${endpoint}`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${API_KEY}`,
      },
      timeout: 10000,
      validateStatus: () => true,
    });

    return {
      model,
      endpoint,
      status: response.status,
      success: response.status >= 200 && response.status < 300,
      error: response.data?.message || response.data?.code || null,
      data: response.data,
    };
  } catch (error: any) {
    return {
      model,
      endpoint,
      status: error.response?.status || 0,
      success: false,
      error: error.message,
      data: null,
    };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔍 Testing All Video Models with Different Endpoints');
  console.log('='.repeat(70));
  console.log('');

  const results: any[] = [];

  for (const model of VIDEO_MODELS) {
    console.log(`\n📹 Testing model: ${model}`);
    console.log('-'.repeat(70));

    for (const endpoint of ENDPOINTS) {
      process.stdout.write(`   ${endpoint.padEnd(20)} ... `);

      const result = await testModelEndpoint(model, endpoint);
      results.push(result);

      if (result.success) {
        console.log(`✅ SUCCESS (${result.status})`);
        console.log(
          `      Response: ${JSON.stringify(result.data).substring(0, 100)}...`,
        );
      } else {
        const errorMsg = result.error || 'Unknown error';
        console.log(`❌ FAILED (${result.status}) - ${errorMsg}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('📊 Summary');
  console.log('='.repeat(70));
  console.log('');

  const successByEndpoint: Record<string, string[]> = {};
  ENDPOINTS.forEach((ep) => (successByEndpoint[ep] = []));

  results.forEach((r) => {
    if (r.success) {
      successByEndpoint[r.endpoint].push(r.model);
    }
  });

  ENDPOINTS.forEach((endpoint) => {
    const models = successByEndpoint[endpoint];
    console.log(`\n${endpoint}:`);
    if (models.length === 0) {
      console.log('   (no successful models)');
    } else {
      models.forEach((m) => console.log(`   ✅ ${m}`));
    }
  });

  console.log('');
  console.log('='.repeat(70));
  console.log('✨ Test completed');
  console.log('='.repeat(70));
}

main();
