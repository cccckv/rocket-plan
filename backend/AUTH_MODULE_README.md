# Authentication Module Documentation

## Overview

Complete authentication system for Rocket Plan (CreateOK) supporting:
- Phone SMS authentication with regional routing (China +86 via Alibaba Cloud, International via Twilio)
- Google OAuth 2.0 authentication
- JWT access + refresh token system
- Redis-based OTP storage and session management
- Rate limiting for SMS sending

## Architecture

### Module Structure
```
src/auth/
├── auth.module.ts              # Module configuration
├── auth.controller.ts          # REST API endpoints
├── auth.service.ts             # Core authentication logic
├── dto/                        # Data transfer objects
│   ├── send-otp.dto.ts
│   ├── verify-otp.dto.ts
│   ├── google-login.dto.ts
│   └── refresh-token.dto.ts
├── services/
│   ├── sms.service.ts          # SMS sending with regional routing
│   ├── sms.d.ts                # Type definitions for Alibaba Cloud SMS SDK
│   └── redis.service.ts        # Redis operations (OTP, tokens, rate limiting)
├── strategies/
│   ├── jwt.strategy.ts         # JWT access token validation
│   ├── jwt-refresh.strategy.ts # JWT refresh token validation
│   └── google.strategy.ts      # Google OAuth strategy
├── guards/
│   ├── jwt-auth.guard.ts       # Protect routes with JWT
│   ├── jwt-refresh.guard.ts    # Protect refresh endpoint
│   └── google-auth.guard.ts    # Google OAuth guard
└── decorators/
    └── current-user.decorator.ts # Extract user from request
```

## API Endpoints

### 1. Send OTP (POST /auth/send-otp)
Send verification code to phone number.

**Request Body:**
```json
{
  "phone": "+8613800138000"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully"
}
```

**Rate Limiting:** 1 OTP per 60 seconds per phone number

### 2. Verify OTP (POST /auth/verify-otp)
Verify OTP and login/register user.

**Request Body:**
```json
{
  "phone": "+8613800138000",
  "otp": "123456"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "phone": "+8613800138000",
    "credits": 2,
    "tier": "free"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d"
}
```

**Business Rules:**
- New users automatically get 2 free video credits
- OTP valid for 5 minutes
- OTP is single-use (deleted after successful verification)

### 3. Google OAuth Login (GET /auth/google)
Redirect user to Google OAuth consent screen.

**Flow:**
1. User clicks "Login with Google"
2. Frontend redirects to `GET /auth/google`
3. Backend redirects to Google OAuth
4. User grants permissions
5. Google redirects to `GET /auth/google/callback`
6. Backend processes OAuth response
7. Backend redirects to frontend with tokens: `{FRONTEND_URL}/auth/callback?accessToken={token}&refreshToken={token}`

### 4. Google OAuth Callback (GET /auth/google/callback)
Handle Google OAuth callback (internal endpoint).

### 5. Refresh Token (POST /auth/refresh)
Get new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d"
}
```

### 6. Logout (POST /auth/logout)
Invalidate refresh token.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### 7. Get Current User (GET /auth/me)
Get current authenticated user info (for testing JWT guard).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "id": 1,
  "phone": "+8613800138000",
  "credits": 2,
  "tier": "free"
}
```

## SMS Regional Routing

### Logic
```typescript
if (phone.startsWith('+86')) {
  // Send via Alibaba Cloud SMS
  // Cost: ~$0.006/SMS
  // Requires: Alibaba Cloud account + SMS service approval (1-2 days)
} else {
  // Send via Twilio
  // Cost: ~$0.04/SMS  
  // Requires: Twilio account with verified phone number
}
```

### Configuration

**Alibaba Cloud SMS (China +86):**
1. Register Alibaba Cloud account
2. Enable SMS service
3. Create SMS signature (requires 1-2 days approval)
4. Create SMS template (requires approval)
5. Get Access Key ID and Secret
6. Configure in `.env`:
```env
ALIBABA_ACCESS_KEY_ID="your-access-key-id"
ALIBABA_ACCESS_KEY_SECRET="your-access-key-secret"
ALIBABA_SMS_SIGN_NAME="your-approved-signature"
ALIBABA_SMS_TEMPLATE_CODE="SMS_123456789"
```

**Twilio SMS (International):**
1. Register Twilio account
2. Verify a phone number (for sending)
3. Get Account SID and Auth Token
4. Configure in `.env`:
```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+15551234567"
```

## JWT Token System

### Access Token
- **Purpose:** Authenticate API requests
- **Lifetime:** 7 days (configurable via `JWT_EXPIRES_IN`)
- **Storage:** Frontend stores in memory or localStorage
- **Payload:** `{ sub: userId, phone?, googleId?, email?, iat, exp }`

### Refresh Token
- **Purpose:** Get new access token without re-authentication
- **Lifetime:** 30 days (configurable via `JWT_REFRESH_EXPIRES_IN`)
- **Storage:** 
  - Frontend: Secure httpOnly cookie (recommended) or localStorage
  - Backend: Redis with expiration matching token lifetime
- **Payload:** `{ sub: userId, phone?, googleId?, email?, iat, exp }`

### Token Refresh Flow
1. Access token expires (7 days)
2. Frontend detects 401 error
3. Frontend calls `/auth/refresh` with refresh token
4. Backend validates refresh token against Redis
5. Backend generates new access + refresh tokens
6. Backend updates Redis with new refresh token
7. Frontend receives new tokens

## Redis Usage

### Keys Structure
```
otp:{phone}                    # OTP code (TTL: 5 minutes)
otp:ratelimit:{phone}          # Rate limit flag (TTL: 60 seconds)
refresh_token:{userId}         # Refresh token (TTL: 30 days)
```

### Operations
- **OTP Storage:** 5-minute TTL, single-use (deleted after verification)
- **Rate Limiting:** 60-second window per phone number
- **Refresh Tokens:** 30-day TTL, one token per user (new login invalidates old token)

## Guards Usage

### Protect Routes with JWT

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('videos')
export class VideosController {
  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserVideos(@CurrentUser() user: any) {
    // user = { id, phone, googleId, email, credits, tier }
    console.log(user.id);
    return { videos: [] };
  }
  
  @Get('public')
  async getPublicVideos() {
    // No authentication required
    return { videos: [] };
  }
}
```

### Get User ID or Specific Field

```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(
  @CurrentUser() user: any,           // Full user object
  @CurrentUser('id') userId: number,  // Just user ID
  @CurrentUser('credits') credits: number, // Just credits
) {
  // ...
}
```

## Environment Variables

```env
# JWT Configuration
JWT_SECRET="your-jwt-secret-change-in-production"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-change-in-production"
JWT_REFRESH_EXPIRES_IN="30d"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# Alibaba Cloud SMS (China +86)
ALIBABA_ACCESS_KEY_ID="your-alibaba-access-key-id"
ALIBABA_ACCESS_KEY_SECRET="your-alibaba-access-key-secret"
ALIBABA_SMS_SIGN_NAME="your-sms-sign-name"
ALIBABA_SMS_TEMPLATE_CODE="your-template-code"

# Twilio SMS (International)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Frontend
FRONTEND_URL="http://localhost:3001"
```

## Security Considerations

1. **JWT Secrets:** Use strong, random secrets in production (minimum 32 characters)
2. **HTTPS Required:** All authentication endpoints MUST use HTTPS in production
3. **Rate Limiting:** SMS sending is rate-limited to prevent abuse (60s cooldown)
4. **OTP Expiration:** OTPs expire after 5 minutes
5. **Token Storage:** 
   - Access tokens: Memory or localStorage (frontend)
   - Refresh tokens: httpOnly cookies (recommended) or secure storage
6. **Redis Security:** Use password authentication for Redis in production
7. **Google OAuth:** Validate redirect URIs in Google Console

## Testing

### Test Accounts (from seed data)
```
Phone Users:
- +8613800138001 (free tier, 2 credits)
- +8613800138002 (basic tier, 10 credits)
- +8613800138003 (pro tier, 50 credits)

Google User:
- googleId: "google_test_123"
- email: "test@gmail.com"
```

### Manual Testing Flow

**1. Phone Authentication:**
```bash
# Send OTP
curl -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+8613800138000"}'

# Check Redis for OTP
redis-cli GET "otp:+8613800138000"

# Verify OTP
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+8613800138000", "otp": "123456"}'

# Use access token
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer {accessToken}"
```

**2. Google OAuth:**
- Open browser: `http://localhost:3000/auth/google`
- Complete OAuth flow
- Extract tokens from redirect URL

**3. Token Refresh:**
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "{refreshToken}"}'
```

## Troubleshooting

### Common Issues

**1. Redis Connection Failed**
- Ensure Redis is running: `redis-cli ping`
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`

**2. Google OAuth Not Working**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check redirect URI matches Google Console settings
- Ensure `FRONTEND_URL` is correct

**3. SMS Not Sending**
- Alibaba Cloud: Verify signature and template are approved
- Twilio: Check account balance and phone number verification
- Check logs for detailed error messages

**4. JWT Token Invalid**
- Verify `JWT_SECRET` matches between requests
- Check token hasn't expired
- Ensure Bearer token format: `Authorization: Bearer {token}`

**5. OTP Expired or Not Found**
- OTPs expire after 5 minutes
- Request a new OTP
- Check Redis connectivity

## Future Enhancements

1. **Email Authentication:** Add email/password login
2. **2FA:** Two-factor authentication for sensitive operations
3. **Session Management:** View and revoke active sessions
4. **Password Reset:** Password recovery flow (if email auth added)
5. **Social Logins:** Add WeChat, Facebook OAuth
6. **Biometric:** Support fingerprint/Face ID on mobile
