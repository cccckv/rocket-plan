#!/usr/bin/env ts-node
/**
 * 测试 aiapikey.ai Veo 模型的最简单调用
 * 使用最便宜的模型: veo3.1-fast-components (¥0.260/次)
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
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

/**
 * 测试 1: 最简单的文本生成视频请求
 */
async function testSimpleTextToVideo() {
  console.log('📹 Test 1: Simple Text-to-Video');
  console.log('   Model: veo3.1-fast-components (最便宜 ¥0.260/次)');
  console.log('   Endpoint: POST /v1/videos');
  console.log('');

  try {
    const payload = {
      model: 'veo3.1-fast-components',
      prompt: 'A cat playing with a ball in a sunny garden',
    };

    console.log('📤 Sending request...');
    console.log(`   Payload: ${JSON.stringify(payload, null, 2)}`);
    console.log('');

    const response = await axios.post(`${API_BASE_URL}/v1/videos`, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      timeout: 30000,
    });

    console.log('✅ Response received:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    return response.data;
  } catch (error: any) {
    console.error('❌ Request failed:');
    if (axios.isAxiosError(error)) {
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Status Text: ${error.response?.statusText}`);
      console.error(`   Response: ${JSON.stringify(error.response?.data, null, 2)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    console.log('');
    throw error;
  }
}

/**
 * 测试 2: 尝试 OpenAI 兼容格式
 */
async function testOpenAIFormat() {
  console.log('📹 Test 2: OpenAI-Compatible Format');
  console.log('   Model: veo3.1-fast-components');
  console.log('   Format: OpenAI chat-style');
  console.log('');

  try {
    const payload = {
      model: 'veo3.1-fast-components',
      messages: [
        {
          role: 'user',
          content: 'Generate a video of a cat playing with a ball in a sunny garden',
        },
      ],
    };

    console.log('📤 Sending request (OpenAI format)...');
    console.log(`   Payload: ${JSON.stringify(payload, null, 2)}`);
    console.log('');

    const response = await axios.post(`${API_BASE_URL}/v1/videos`, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      timeout: 30000,
    });

    console.log('✅ Response received (OpenAI format):');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    return response.data;
  } catch (error: any) {
    console.error('❌ OpenAI format failed:');
    if (axios.isAxiosError(error)) {
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Status Text: ${error.response?.statusText}`);
      console.error(`   Response: ${JSON.stringify(error.response?.data, null, 2)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    console.log('');
  }
}

/**
 * 测试 3: 尝试查询任务状态
 */
async function testQueryStatus(taskId: string) {
  console.log('🔍 Test 3: Query Task Status');
  console.log(`   Task ID: ${taskId}`);
  console.log('');

  const endpoints = [
    `/v1/videos/${taskId}`,
    `/v1/videos?id=${taskId}`,
    `/v1/videos/status/${taskId}`,
    `/v1/video/generations/${taskId}`,
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`   Trying: GET ${endpoint}`);

      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        timeout: 10000,
      });

      console.log(`   ✅ Success! Status: ${response.status}`);
      console.log(JSON.stringify(response.data, null, 2));
      console.log('');

      return { endpoint, data: response.data };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.log(`   ❌ Failed: ${error.response?.status} ${error.response?.statusText}`);
      } else {
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }
  }

  console.log('   ⚠️ All status query endpoints failed');
  console.log('');
}

/**
 * 主测试流程
 */
async function main() {
  console.log('='.repeat(60));
  console.log('🚀 Veo API Simple Test - aiapikey.ai');
  console.log('='.repeat(60));
  console.log('');

  try {
    // 测试 1: 最简单的文本生成视频
    const result1 = await testSimpleTextToVideo();

    // 如果成功，尝试查询状态
    if (result1 && result1.id) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 等待 2 秒
      await testQueryStatus(result1.id);
    }
  } catch (error) {
    console.log('⚠️ Test 1 failed, trying Test 2...');
    console.log('');
  }

  try {
    // 测试 2: OpenAI 格式
    await testOpenAIFormat();
  } catch (error) {
    console.log('⚠️ Test 2 also failed');
  }

  console.log('='.repeat(60));
  console.log('✨ Test completed');
  console.log('='.repeat(60));
}

// 运行测试
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
