#!/usr/bin/env ts-node
import axios from 'axios';
import FormData from 'form-data';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE_URL = process.env.AIAPIKEY_BASE_URL || 'https://aiapikey.ai';
const API_KEY = process.env.AIAPIKEY_API_KEY;

async function testDirectAPI() {
  console.log('='.repeat(70));
  console.log('🎬 Direct AI API Test - Full Video Generation Flow');
  console.log('='.repeat(70));
  console.log('');

  console.log('Step 1: Create video generation task');
  console.log(`  Model: veo3.1-fast-components (¥0.260)`);
  console.log(`  Endpoint: POST ${API_BASE_URL}/v1/videos`);
  console.log('');

  const form = new FormData();
  form.append('model', 'veo3.1-fast-components');
  form.append('prompt', 'A beautiful sunset over mountains with birds flying');

  const createResponse = await axios.post(
    `${API_BASE_URL}/v1/videos`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${API_KEY}`,
      },
      timeout: 30000,
    },
  );

  console.log('✅ Task created:');
  console.log(JSON.stringify(createResponse.data, null, 2));
  console.log('');

  const videoId = createResponse.data.id;

  console.log('Step 2: Wait for video generation...');
  console.log('');

  const maxAttempts = 20;
  const intervalMs = 5000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    console.log(`  Polling attempt ${i + 1}/${maxAttempts}...`);

    const statusResponse = await axios.get(
      `${API_BASE_URL}/v1/videos/${videoId}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        timeout: 30000,
      },
    );

    const data = statusResponse.data;
    console.log(`    Status: ${data.status}, Progress: ${data.progress}%`);

    if (data.status === 'completed') {
      console.log('');
      console.log('✅ Video generation completed!');
      console.log('');
      console.log('Final Response:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');
      console.log('Video URL:');
      console.log(data.url || data.video_url || data.result_url);
      console.log('');

      console.log('Step 3: Download video...');
      const videoUrl = data.url || data.video_url || data.result_url;
      const videoResponse = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 120000,
      });

      const filename = `./test-video-${videoId}.mp4`;
      const fs = require('fs');
      fs.writeFileSync(filename, videoResponse.data);

      console.log(`✅ Video downloaded: ${filename}`);
      console.log(`   Size: ${(videoResponse.data.length / 1024 / 1024).toFixed(2)} MB`);

      console.log('');
      console.log('='.repeat(70));
      console.log('✅ Complete flow test passed!');
      console.log('='.repeat(70));
      return;
    }

    if (data.status === 'failed') {
      console.log('');
      console.log('❌ Video generation failed:');
      console.log(JSON.stringify(data, null, 2));
      throw new Error('Video generation failed');
    }
  }

  throw new Error('Timeout waiting for video generation');
}

testDirectAPI().catch((error) => {
  console.error('');
  console.error('❌ Test failed:', error.message);
  if (axios.isAxiosError(error)) {
    console.error('Response:', error.response?.data);
  }
  process.exit(1);
});
