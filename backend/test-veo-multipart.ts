#!/usr/bin/env ts-node
import axios from 'axios';
import FormData from 'form-data';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE_URL = process.env.AIAPIKEY_BASE_URL || 'https://aiapikey.ai';
const API_KEY = process.env.AIAPIKEY_API_KEY;

if (!API_KEY) {
  console.error('❌ AIAPIKEY_API_KEY not found in .env');
  process.exit(1);
}

console.log('🔧 Configuration:');
console.log(`   Base URL: ${API_BASE_URL}`);
console.log(`   API Key: ${API_KEY.substring(0, 20)}...`);
console.log('');

async function testMultipartFormData() {
  console.log('📹 Test: Multipart Form-Data Format');
  console.log('   Model: veo3.1-fast-components (¥0.260/次)');
  console.log('   Endpoint: POST /v1/videos');
  console.log('   Content-Type: multipart/form-data');
  console.log('');

  try {
    const form = new FormData();
    form.append('model', 'veo3.1-fast-components');
    form.append('prompt', 'A cat playing with a ball in a sunny garden');

    console.log('📤 Sending multipart/form-data request...');
    console.log('   Fields:');
    console.log('     - model: veo3.1-fast-components');
    console.log('     - prompt: A cat playing with a ball in a sunny garden');
    console.log('');

    const response = await axios.post(`${API_BASE_URL}/v1/videos`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${API_KEY}`,
      },
      timeout: 30000,
    });

    console.log('✅ Success! Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    return response.data;
  } catch (error: any) {
    console.error('❌ Request failed:');
    if (axios.isAxiosError(error)) {
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Status Text: ${error.response?.statusText}`);
      console.error(`   Response:`);
      console.error(JSON.stringify(error.response?.data, null, 2));
      console.error('');
      console.error(`   Headers:`);
      console.error(JSON.stringify(error.response?.headers, null, 2));
    } else {
      console.error(`   Error: ${error.message}`);
    }
    console.log('');
    throw error;
  }
}

async function testQueryStatus(taskId: string) {
  console.log('🔍 Test: Query Task Status');
  console.log(`   Task ID: ${taskId}`);
  console.log('');

  const endpoints = [
    { method: 'GET', url: `/v1/videos/${taskId}` },
    { method: 'GET', url: `/v1/videos?id=${taskId}` },
    { method: 'GET', url: `/v1/videos/status?id=${taskId}` },
    { method: 'POST', url: `/v1/videos/status`, data: { id: taskId } },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`   Trying: ${endpoint.method} ${endpoint.url}`);

      const config: any = {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        timeout: 10000,
      };

      let response;
      if (endpoint.method === 'GET') {
        response = await axios.get(`${API_BASE_URL}${endpoint.url}`, config);
      } else {
        response = await axios.post(
          `${API_BASE_URL}${endpoint.url}`,
          endpoint.data,
          config,
        );
      }

      console.log(`   ✅ Success! Status: ${response.status}`);
      console.log(JSON.stringify(response.data, null, 2));
      console.log('');

      return { endpoint: endpoint.url, data: response.data };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.log(
          `   ❌ ${error.response?.status} ${error.response?.statusText}`,
        );
      } else {
        console.log(`   ❌ ${error.message}`);
      }
    }
  }

  console.log('   ⚠️ All status query attempts failed');
  console.log('');
}

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 Veo API Test - Multipart Form-Data');
  console.log('='.repeat(60));
  console.log('');

  try {
    const result = await testMultipartFormData();

    if (result && result.id) {
      console.log('⏳ Waiting 2 seconds before querying status...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await testQueryStatus(result.id);
    } else if (result && result.task_id) {
      console.log('⏳ Waiting 2 seconds before querying status...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await testQueryStatus(result.task_id);
    } else {
      console.log('⚠️ No task ID found in response');
    }
  } catch (error) {
    console.log('❌ Test failed');
  }

  console.log('='.repeat(60));
  console.log('✨ Test completed');
  console.log('='.repeat(60));
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
