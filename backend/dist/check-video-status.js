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
const fs = __importStar(require("fs"));
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
        const response = await axios_1.default.get(`${API_BASE_URL}/v1/videos/${VIDEO_ID}`, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
            timeout: 30000,
        });
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
            const videoResponse = await axios_1.default.get(data.url, {
                responseType: 'arraybuffer',
                timeout: 120000,
            });
            const filename = `./downloaded-video-${VIDEO_ID}.mp4`;
            fs.writeFileSync(filename, videoResponse.data);
            console.log(`✅ Video downloaded: ${filename}`);
            console.log(`   Size: ${videoResponse.data.length} bytes`);
        }
        else {
            console.log(`⏳ Video status: ${data.status}`);
            console.log(`   Progress: ${data.progress || 0}%`);
        }
        return response.data;
    }
    catch (error) {
        console.error('❌ Failed to check status:');
        if (axios_1.default.isAxiosError(error)) {
            console.error(`   Status: ${error.response?.status}`);
            console.error(`   Response:`, error.response?.data);
        }
        else {
            console.error(`   Error: ${error.message}`);
        }
        throw error;
    }
}
checkVideoStatus();
//# sourceMappingURL=check-video-status.js.map