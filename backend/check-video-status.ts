#!/usr/bin/env ts-node
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE_URL = process.env.AIAPIKEY_BASE_URL || 'https://aiapikey.ai';
const API_KEY = process.env.AIAPIKEY_API_KEY;

const VIDEO_ID = 'video_509c7656-2f54-4c8e-b547-df6c8595a0cc';

async function checkVideoStatus() {
  console.log('🔍 Checking video status...');
  console.log(`   Video ID: ${VIDEO_ID}`);
  console.log(`   Endpoint: GET ${API_BASE_URL}/v1/videos/${VIDEO_ID}`);
  console.log('');

  try {
    const response = await axios.get(
      `${API_BASE_URL}/v1/videos/${VIDEO_ID}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        timeout: 30000,
      },
    );

    console.log('✅ Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    const data = response.data;

    if (data.status === 'completed' && data.url) {
      console.log('🎬 Video is ready!');
      console.log(`   URL: ${data.url}`);
      console.log(`   Duration: ${data.seconds || data.duration || 'N/A'}s`);
      console.log(`   Size: ${data.size || 'N/A'}`);
      console.log('');

      console.log('📥 Downloading video...');
      const videoResponse = await axios.get(data.url, {
        responseType: 'arraybuffer',
        timeout: 120000,
      });

      const filename = `./downloaded-video-${VIDEO_ID}.mp4`;
      fs.writeFileSync(filename, videoResponse.data);

      console.log(`✅ Video downloaded: ${filename}`);
      console.log(`   Size: ${videoResponse.data.length} bytes`);
    } else {
      console.log(`⏳ Video status: ${data.status}`);
      console.log(`   Progress: ${data.progress || 0}%`);
    }

    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to check status:');
    if (axios.isAxiosError(error)) {
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Response:`, error.response?.data);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    throw error;
  }
}

checkVideoStatus();
