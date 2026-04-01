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
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
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
        const response = await axios_1.default.post(`${API_BASE_URL}/v1/videos`, payload, {
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
    }
    catch (error) {
        console.error('❌ Request failed:');
        if (axios_1.default.isAxiosError(error)) {
            console.error(`   Status: ${error.response?.status}`);
            console.error(`   Status Text: ${error.response?.statusText}`);
            console.error(`   Response: ${JSON.stringify(error.response?.data, null, 2)}`);
        }
        else {
            console.error(`   Error: ${error.message}`);
        }
        console.log('');
        throw error;
    }
}
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
        const response = await axios_1.default.post(`${API_BASE_URL}/v1/videos`, payload, {
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
    }
    catch (error) {
        console.error('❌ OpenAI format failed:');
        if (axios_1.default.isAxiosError(error)) {
            console.error(`   Status: ${error.response?.status}`);
            console.error(`   Status Text: ${error.response?.statusText}`);
            console.error(`   Response: ${JSON.stringify(error.response?.data, null, 2)}`);
        }
        else {
            console.error(`   Error: ${error.message}`);
        }
        console.log('');
    }
}
async function testQueryStatus(taskId) {
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
            const response = await axios_1.default.get(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                },
                timeout: 10000,
            });
            console.log(`   ✅ Success! Status: ${response.status}`);
            console.log(JSON.stringify(response.data, null, 2));
            console.log('');
            return { endpoint, data: response.data };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.log(`   ❌ Failed: ${error.response?.status} ${error.response?.statusText}`);
            }
            else {
                console.log(`   ❌ Failed: ${error.message}`);
            }
        }
    }
    console.log('   ⚠️ All status query endpoints failed');
    console.log('');
}
async function main() {
    console.log('='.repeat(60));
    console.log('🚀 Veo API Simple Test - aiapikey.ai');
    console.log('='.repeat(60));
    console.log('');
    try {
        const result1 = await testSimpleTextToVideo();
        if (result1 && result1.id) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            await testQueryStatus(result1.id);
        }
    }
    catch (error) {
        console.log('⚠️ Test 1 failed, trying Test 2...');
        console.log('');
    }
    try {
        await testOpenAIFormat();
    }
    catch (error) {
        console.log('⚠️ Test 2 also failed');
    }
    console.log('='.repeat(60));
    console.log('✨ Test completed');
    console.log('='.repeat(60));
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=test-veo-simple.js.map