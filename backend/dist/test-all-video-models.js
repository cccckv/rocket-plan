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
async function testModelEndpoint(model, endpoint) {
    try {
        const form = new form_data_1.default();
        form.append('model', model);
        form.append('prompt', 'A test video prompt');
        const response = await axios_1.default.post(`${API_BASE_URL}${endpoint}`, form, {
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
    }
    catch (error) {
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
    const results = [];
    for (const model of VIDEO_MODELS) {
        console.log(`\n📹 Testing model: ${model}`);
        console.log('-'.repeat(70));
        for (const endpoint of ENDPOINTS) {
            process.stdout.write(`   ${endpoint.padEnd(20)} ... `);
            const result = await testModelEndpoint(model, endpoint);
            results.push(result);
            if (result.success) {
                console.log(`✅ SUCCESS (${result.status})`);
                console.log(`      Response: ${JSON.stringify(result.data).substring(0, 100)}...`);
            }
            else {
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
    const successByEndpoint = {};
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
        }
        else {
            models.forEach((m) => console.log(`   ✅ ${m}`));
        }
    });
    console.log('');
    console.log('='.repeat(70));
    console.log('✨ Test completed');
    console.log('='.repeat(70));
}
main();
//# sourceMappingURL=test-all-video-models.js.map