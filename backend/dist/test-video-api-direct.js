#!/usr/bin/env ts-node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
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
    const form = new form_data_1.default();
    form.append('model', 'veo3.1-fast-components');
    form.append('prompt', 'A beautiful sunset over mountains with birds flying');
    const createResponse = await axios_1.default.post(`${API_BASE_URL}/v1/videos`, form, {
        headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${API_KEY}`,
        },
        timeout: 30000,
    });
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
        const statusResponse = await axios_1.default.get(`${API_BASE_URL}/v1/videos/${videoId}`, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
            timeout: 30000,
        });
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
            const videoResponse = await axios_1.default.get(videoUrl, {
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
    if (axios_1.default.isAxiosError(error)) {
        console.error('Response:', error.response?.data);
    }
    process.exit(1);
});
//# sourceMappingURL=test-video-api-direct.js.map