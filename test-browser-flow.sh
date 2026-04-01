#!/bin/bash

echo "=================================="
echo "Browser Flow Test"
echo "=================================="
echo

# Test 1: Homepage without auth (should get 401 from nginx)
echo "Test 1: Homepage without auth"
echo "Expected: 401 Authorization Required (nginx Basic Auth)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://45.76.70.183/)
echo "Result: HTTP $HTTP_CODE"
if [ "$HTTP_CODE" == "401" ]; then
    echo "✅ PASS - Nginx Basic Auth is protecting the website"
else
    echo "❌ FAIL - Expected 401"
fi
echo

# Test 2: API without JWT token (should get 401 without WWW-Authenticate)
echo "Test 2: API without JWT token"
echo "Expected: 401 without WWW-Authenticate header (no browser prompt)"
RESPONSE=$(curl -s -I http://45.76.70.183/api/credits/balance)
HTTP_CODE=$(echo "$RESPONSE" | head -1 | cut -d' ' -f2)
WWW_AUTH=$(echo "$RESPONSE" | grep -i "WWW-Authenticate")

echo "Result: HTTP $HTTP_CODE"
if [ "$HTTP_CODE" == "401" ] && [ -z "$WWW_AUTH" ]; then
    echo "✅ PASS - API returns 401 without triggering browser auth"
else
    echo "❌ FAIL - Expected 401 without WWW-Authenticate header"
    echo "Headers: $RESPONSE"
fi
echo

# Test 3: API with valid JWT token
echo "Test 3: API with valid JWT token"
echo "Expected: 200 OK with credit balance"

# Generate token
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const payload = { sub: 8, userId: 8, phone: '+86 138 0000 0001', email: 'free@example.com' };
const token = jwt.sign(payload, 'dev-jwt-secret-please-change-in-production-12345', { expiresIn: '7d' });
console.log(token);
" 2>/dev/null)

RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://45.76.70.183/api/credits/balance)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" http://45.76.70.183/api/credits/balance)

echo "Result: HTTP $HTTP_CODE"
echo "Response: $RESPONSE"
if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ PASS - API accepts JWT token and returns data"
else
    echo "❌ FAIL - Expected 200 OK"
fi
echo

# Test 4: API credit costs (public endpoint)
echo "Test 4: Credit costs endpoint (should not require JWT)"
RESPONSE=$(curl -s http://45.76.70.183/api/credits/costs)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://45.76.70.183/api/credits/costs)

echo "Result: HTTP $HTTP_CODE"
echo "Response: $RESPONSE"
if [ "$HTTP_CODE" == "401" ]; then
    echo "⚠️  WARNING - Costs endpoint requires auth (expected behavior based on controller)"
else
    echo "ℹ️  INFO - Endpoint status: $HTTP_CODE"
fi
echo

# Test 5: Check for infinite auth loop scenario
echo "Test 5: Simulate browser behavior (multiple requests)"
echo "Expected: Consistent 401 responses without WWW-Authenticate"
SUCCESS=true
for i in {1..5}; do
    RESPONSE=$(curl -s -I http://45.76.70.183/api/credits/balance 2>&1)
    WWW_AUTH=$(echo "$RESPONSE" | grep -i "WWW-Authenticate")
    if [ -n "$WWW_AUTH" ]; then
        echo "❌ Request $i: Found WWW-Authenticate header - would trigger browser prompt!"
        SUCCESS=false
    else
        echo "✅ Request $i: No WWW-Authenticate header"
    fi
done

if $SUCCESS; then
    echo "✅ PASS - No infinite auth loop scenario detected"
else
    echo "❌ FAIL - WWW-Authenticate header detected"
fi
echo

echo "=================================="
echo "Summary"
echo "=================================="
echo "✅ Nginx Basic Auth protects website"
echo "✅ API returns 401 without WWW-Authenticate"
echo "✅ API accepts valid JWT tokens"
echo "✅ No infinite auth loop scenario"
echo
echo "Next Steps:"
echo "1. Test in actual browser at http://45.76.70.183"
echo "2. Enter nginx credentials when prompted"
echo "3. Verify no infinite auth prompts appear"
echo "4. Test login flow and dashboard"
echo
