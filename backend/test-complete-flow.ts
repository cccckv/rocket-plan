#!/usr/bin/env ts-node
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE = 'http://localhost:3002';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'test123456';

let authToken: string;
let userId: number;

async function register() {
  console.log('📝 Step 1: Register test user');
  try {
    const response = await axios.post(`${API_BASE}/api/auth/register`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      name: 'Test User',
    });
    authToken = response.data.access_token;
    userId = response.data.user.id;
    console.log(`   ✅ Registered: userId=${userId}`);
  } catch (error: any) {
    if (error.response?.status === 400) {
      console.log('   ℹ️  User exists, trying login...');
      await login();
    } else {
      throw error;
    }
  }
}

async function login() {
  console.log('🔐 Step 1b: Login');
  const response = await axios.post(`${API_BASE}/api/auth/login`, {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });
  authToken = response.data.access_token;
  userId = response.data.user.id;
  console.log(`   ✅ Logged in: userId=${userId}`);
}

async function createVideoTask() {
  console.log('');
  console.log('📹 Step 2: Create video generation task');
  console.log('   Model: veo3.1-fast-components (¥0.260 - cheapest)');
  console.log('   Type: text-to-video');

  const response = await axios.post(
    `${API_BASE}/api/videos/generate`,
    {
      type: 'text-to-video',
      model: 'veo3.1-fast-components',
      prompt: 'A beautiful sunset over mountains with birds flying',
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  );

  const task = response.data;
  console.log(`   ✅ Task created: ${task.id}`);
  console.log(`   Status: ${task.status}`);
  console.log('');
  return task.id;
}

async function pollTaskStatus(taskId: string) {
  console.log('🔄 Step 3: Polling task status');
  const maxAttempts = 20;
  const intervalMs = 5000;

  for (let i = 0; i < maxAttempts; i++) {
    console.log(`   Attempt ${i + 1}/${maxAttempts}...`);

    const response = await axios.post(
      `${API_BASE}/api/videos/tasks/${taskId}/poll`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    const task = response.data;
    console.log(`   Status: ${task.status}, Progress: ${task.progress || 0}%`);

    if (task.status === 'completed') {
      console.log('   ✅ Video generation completed!');
      console.log(`   Result URL: ${task.resultUrl}`);
      console.log(`   Local Path: ${task.localPath || 'downloading...'}`);
      return task;
    }

    if (task.status === 'failed') {
      console.log(`   ❌ Video generation failed: ${task.errorMsg}`);
      throw new Error(task.errorMsg);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Timeout waiting for video generation');
}

async function getTaskDetails(taskId: string) {
  console.log('');
  console.log('📊 Step 4: Get task details');

  const response = await axios.get(`${API_BASE}/api/videos/tasks/${taskId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const task = response.data;
  console.log('   Task Details:');
  console.log(`     ID: ${task.id}`);
  console.log(`     Status: ${task.status}`);
  console.log(`     Model: ${task.model}`);
  console.log(`     Prompt: ${task.prompt}`);
  console.log(`     Result URL: ${task.resultUrl || 'N/A'}`);
  console.log(`     Local Path: ${task.localPath || 'N/A'}`);
  console.log(`     Created: ${task.createdAt}`);
  console.log(`     Updated: ${task.updatedAt}`);

  return task;
}

async function listTasks() {
  console.log('');
  console.log('📋 Step 5: List user tasks');

  const response = await axios.get(`${API_BASE}/api/videos/tasks`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  console.log(`   Total tasks: ${response.data.total}`);
  console.log(
    `   Showing: ${response.data.items.length} (page ${response.data.page}/${response.data.totalPages})`,
  );

  return response.data;
}

async function main() {
  console.log('='.repeat(70));
  console.log('🚀 Complete Video API Flow Test');
  console.log('='.repeat(70));
  console.log('');

  try {
    await register();

    const taskId = await createVideoTask();

    const completedTask = await pollTaskStatus(taskId);

    await getTaskDetails(taskId);

    await listTasks();

    console.log('');
    console.log('='.repeat(70));
    console.log('✅ All tests passed!');
    console.log('='.repeat(70));
  } catch (error: any) {
    console.error('');
    console.error('='.repeat(70));
    console.error('❌ Test failed:');
    if (axios.isAxiosError(error)) {
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Message: ${error.response?.data?.message || error.message}`);
      console.error(`   Data:`, JSON.stringify(error.response?.data, null, 2));
    } else {
      console.error(`   Error: ${error.message}`);
    }
    console.error('='.repeat(70));
    process.exit(1);
  }
}

main();
