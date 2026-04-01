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
const API_BASE = 'http://localhost:3002';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'test123456';
let authToken;
let userId;
async function register() {
    console.log('📝 Step 1: Register test user');
    try {
        const response = await axios_1.default.post(`${API_BASE}/api/auth/register`, {
            email: TEST_USER_EMAIL,
            password: TEST_USER_PASSWORD,
            name: 'Test User',
        });
        authToken = response.data.access_token;
        userId = response.data.user.id;
        console.log(`   ✅ Registered: userId=${userId}`);
    }
    catch (error) {
        if (error.response?.status === 400) {
            console.log('   ℹ️  User exists, trying login...');
            await login();
        }
        else {
            throw error;
        }
    }
}
async function login() {
    console.log('🔐 Step 1b: Login');
    const response = await axios_1.default.post(`${API_BASE}/api/auth/login`, {
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
    const response = await axios_1.default.post(`${API_BASE}/api/videos/generate`, {
        type: 'text-to-video',
        model: 'veo3.1-fast-components',
        prompt: 'A beautiful sunset over mountains with birds flying',
    }, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    });
    const task = response.data;
    console.log(`   ✅ Task created: ${task.id}`);
    console.log(`   Status: ${task.status}`);
    console.log('');
    return task.id;
}
async function pollTaskStatus(taskId) {
    console.log('🔄 Step 3: Polling task status');
    const maxAttempts = 20;
    const intervalMs = 5000;
    for (let i = 0; i < maxAttempts; i++) {
        console.log(`   Attempt ${i + 1}/${maxAttempts}...`);
        const response = await axios_1.default.post(`${API_BASE}/api/videos/tasks/${taskId}/poll`, {}, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
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
async function getTaskDetails(taskId) {
    console.log('');
    console.log('📊 Step 4: Get task details');
    const response = await axios_1.default.get(`${API_BASE}/api/videos/tasks/${taskId}`, {
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
    const response = await axios_1.default.get(`${API_BASE}/api/videos/tasks`, {
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    });
    console.log(`   Total tasks: ${response.data.total}`);
    console.log(`   Showing: ${response.data.items.length} (page ${response.data.page}/${response.data.totalPages})`);
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
    }
    catch (error) {
        console.error('');
        console.error('='.repeat(70));
        console.error('❌ Test failed:');
        if (axios_1.default.isAxiosError(error)) {
            console.error(`   Status: ${error.response?.status}`);
            console.error(`   Message: ${error.response?.data?.message || error.message}`);
            console.error(`   Data:`, JSON.stringify(error.response?.data, null, 2));
        }
        else {
            console.error(`   Error: ${error.message}`);
        }
        console.error('='.repeat(70));
        process.exit(1);
    }
}
main();
//# sourceMappingURL=test-complete-flow.js.map