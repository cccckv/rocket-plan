"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const BASE_URL = 'http://localhost:3002';
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiZnJlZUBleGFtcGxlLmNvbSIsImlhdCI6MTcxMTY5NTYwMCwiZXhwIjoxNzEyMzAwNDAwfQ.test';
async function testCreditSystem() {
    console.log('=== Credit System Test ===\n');
    try {
        console.log('1. Get initial credit balance...');
        const balanceRes = await axios_1.default.get(`${BASE_URL}/api/credits/balance`, {
            headers: { Authorization: `Bearer ${testToken}` },
        });
        console.log('Balance:', balanceRes.data);
        console.log('');
        console.log('2. Get credit costs for all models...');
        const costsRes = await axios_1.default.get(`${BASE_URL}/api/credits/costs`, {
            headers: { Authorization: `Bearer ${testToken}` },
        });
        console.log('Credit costs:', costsRes.data.costs.slice(0, 5));
        console.log(`... (${costsRes.data.costs.length} models total)`);
        console.log('');
        console.log('3. Get transaction history...');
        const historyRes = await axios_1.default.get(`${BASE_URL}/api/credits/transactions?limit=5`, {
            headers: { Authorization: `Bearer ${testToken}` },
        });
        console.log('Transactions:', historyRes.data);
        console.log('');
        console.log('4. Test video generation (should deduct credits)...');
        try {
            const videoRes = await axios_1.default.post(`${BASE_URL}/api/videos/generate`, {
                type: 'text-to-video',
                model: 'veo3.1-fast-components',
                prompt: 'Test credit deduction: A cat playing with a ball',
                duration: 5,
                aspectRatio: '9:16',
                resolution: '720P',
            }, {
                headers: { Authorization: `Bearer ${testToken}` },
            });
            console.log('Video task created:', {
                id: videoRes.data.id,
                status: videoRes.data.status,
                model: videoRes.data.model,
            });
            console.log('');
            console.log('5. Check balance after video generation...');
            const newBalanceRes = await axios_1.default.get(`${BASE_URL}/api/credits/balance`, {
                headers: { Authorization: `Bearer ${testToken}` },
            });
            console.log('New balance:', newBalanceRes.data);
            console.log('');
            console.log('6. Check transaction history again...');
            const newHistoryRes = await axios_1.default.get(`${BASE_URL}/api/credits/transactions?limit=5`, {
                headers: { Authorization: `Bearer ${testToken}` },
            });
            console.log('New transactions:', newHistoryRes.data);
        }
        catch (videoError) {
            if (videoError.response) {
                console.log('Video generation failed (expected if insufficient credits):');
                console.log('Error:', videoError.response.data);
            }
            else {
                throw videoError;
            }
        }
        console.log('\n=== Test Complete ===');
    }
    catch (error) {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        }
        else {
            console.error('Error:', error.message);
        }
    }
}
testCreditSystem();
//# sourceMappingURL=test-credit-system.js.map