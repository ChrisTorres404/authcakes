# System Authentication Testing Guide

## Overview
This guide explains how to test the two-tier authentication system (System + User auth) in AuthCakes API.

## System Authentication Methods

### 1. API Key Authentication
Use a pre-shared API key in the request header.

**Header**: `X-System-API-Key`  
**Test Keys** (from .env):
- `sk_test_gmt9MsfGM5h830F8JFVQ5NCmgQnBj6ECGhzbDCBZG8aW5dOCYu7vC591IVZ8j`
- `sk_live_XYZ123456789ABCDEF`

### 2. System JWT Authentication
Exchange an API key for a JWT token that expires.

**Header**: `X-System-Authorization: Bearer <token>`

## Testing Steps

### Step 1: Start the Server
```bash
npm run build
npm start
```

### Step 2: Access Swagger UI
Navigate to: http://localhost:5050/api/docs

### Step 3: Generate System JWT Token

#### Using cURL:
```bash
curl -X POST http://localhost:5050/api/v1/system/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "sk_test_gmt9MsfGM5h830F8JFVQ5NCmgQnBj6ECGhzbDCBZG8aW5dOCYu7vC591IVZ8j",
    "clientId": "mobile-app-v1",
    "permissions": ["read", "write"]
  }'
```

#### Using Swagger UI:
1. Find the `System Auth` section
2. Click on `POST /api/v1/system/auth/token`
3. Click "Try it out"
4. Use this request body:
```json
{
  "apiKey": "sk_test_gmt9MsfGM5h830F8JFVQ5NCmgQnBj6ECGhzbDCBZG8aW5dOCYu7vC591IVZ8j",
  "clientId": "mobile-app-v1",
  "permissions": ["read", "write"]
}
```
5. Click "Execute"
6. Copy the `token` from the response

### Step 4: Test System-Only Authentication

#### Test Endpoint: `GET /api/test/system-auth`

**Option A: Using API Key**
```bash
curl -X GET http://localhost:5050/api/test/system-auth \
  -H "X-System-API-Key: sk_test_gmt9MsfGM5h830F8JFVQ5NCmgQnBj6ECGhzbDCBZG8aW5dOCYu7vC591IVZ8j"
```

**Option B: Using System JWT**
```bash
curl -X GET http://localhost:5050/api/test/system-auth \
  -H "X-System-Authorization: Bearer <your-system-jwt-token>"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "System authentication successful",
  "system": {
    "authenticated": true,
    "method": "api-key", // or "jwt"
    "keyId": "...1IVZ8j", // last 8 chars of API key
    "clientId": "mobile-app-v1" // if using JWT
  },
  "timestamp": "2025-01-05T20:00:00.000Z"
}
```

### Step 5: Test Combined System + User Authentication

First, you need a user token:

1. **Register a user** (if needed):
```bash
curl -X POST http://localhost:5050/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

2. **Login to get user token**:
```bash
curl -X POST http://localhost:5050/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

3. **Test the dual-auth endpoint**:
```bash
curl -X GET http://localhost:5050/api/test/system-and-user-auth \
  -H "X-System-API-Key: sk_test_gmt9MsfGM5h830F8JFVQ5NCmgQnBj6ECGhzbDCBZG8aW5dOCYu7vC591IVZ8j" \
  -H "Authorization: Bearer <user-jwt-token>"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "System and user authentication successful",
  "system": {
    "authenticated": true,
    "method": "api-key",
    "keyId": "...1IVZ8j"
  },
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "test@example.com",
    "role": "user"
  },
  "timestamp": "2025-01-05T20:00:00.000Z"
}
```

### Step 6: Using Swagger UI Authorization

1. Click the "Authorize" button in Swagger UI
2. You'll see three authentication options:
   - **SystemApiKey**: Enter your API key
   - **SystemJWT**: Enter `Bearer <system-jwt-token>`
   - **UserJWT**: Enter `Bearer <user-jwt-token>`
3. Fill in the appropriate values
4. Click "Authorize" for each one you want to use
5. Now all "Try it out" requests will include these headers

### Testing Error Cases

#### Missing System Authentication:
```bash
curl -X GET http://localhost:5050/api/test/system-auth
```
**Expected**: 401 Unauthorized - "System authentication required"

#### Invalid API Key:
```bash
curl -X GET http://localhost:5050/api/test/system-auth \
  -H "X-System-API-Key: invalid-key"
```
**Expected**: 401 Unauthorized - "System authentication failed"

#### Expired System JWT:
Wait 24 hours (or set `SYSTEM_JWT_EXPIRATION_MINUTES=1` in .env for testing)
**Expected**: 401 Unauthorized - "System authentication failed"

#### Missing User Auth (on dual-auth endpoint):
```bash
curl -X GET http://localhost:5050/api/test/system-and-user-auth \
  -H "X-System-API-Key: sk_test_gmt9MsfGM5h830F8JFVQ5NCmgQnBj6ECGhzbDCBZG8aW5dOCYu7vC591IVZ8j"
```
**Expected**: 401 Unauthorized - "Authentication required"

## Environment Configuration

### Enable System Auth Globally
Set in `.env`:
```env
REQUIRE_SYSTEM_AUTH=true
```
This will require system authentication for ALL endpoints (except public ones).

### Configure API Keys
```env
SYSTEM_API_KEYS=key1,key2,key3
```
Comma-separated list of valid API keys.

### Configure Active Clients
```env
SYSTEM_ACTIVE_CLIENTS=mobile-app-v1,web-app-v1,admin-portal
```
Only these client IDs will be accepted in system JWTs.

## Integration Examples

### JavaScript/TypeScript
```typescript
const apiKey = 'sk_test_gmt9MsfGM5h830F8JFVQ5NCmgQnBj6ECGhzbDCBZG8aW5dOCYu7vC591IVZ8j';
const userToken = 'user-jwt-token';

// Using API Key
const response = await fetch('http://localhost:5050/api/test/system-and-user-auth', {
  headers: {
    'X-System-API-Key': apiKey,
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  }
});

// Using System JWT
const systemToken = await getSystemToken(apiKey); // Implement this
const response2 = await fetch('http://localhost:5050/api/test/system-and-user-auth', {
  headers: {
    'X-System-Authorization': `Bearer ${systemToken}`,
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  }
});
```

### Python
```python
import requests

api_key = 'sk_test_gmt9MsfGM5h830F8JFVQ5NCmgQnBj6ECGhzbDCBZG8aW5dOCYu7vC591IVZ8j'
user_token = 'user-jwt-token'

# Using API Key
response = requests.get(
    'http://localhost:5050/api/test/system-and-user-auth',
    headers={
        'X-System-API-Key': api_key,
        'Authorization': f'Bearer {user_token}'
    }
)

print(response.json())
```

## Security Best Practices

1. **Never expose API keys in client-side code**
2. **Use System JWT for client applications** - Exchange API key for JWT on your backend
3. **Rotate API keys regularly**
4. **Use different API keys for different environments** (dev, staging, prod)
5. **Monitor API key usage** - Check system.clientId in logs
6. **Implement IP whitelisting** for production API keys
7. **Use HTTPS in production** to protect tokens in transit

## Troubleshooting

### "System authentication required"
- Check if you're sending the X-System-API-Key or X-System-Authorization header
- Verify the header name is exactly correct (case-sensitive)

### "Invalid system API key"
- Check if the API key is in the SYSTEM_API_KEYS environment variable
- Ensure no extra spaces or quotes around the key

### "Client not authorized"
- Check if the clientId is in SYSTEM_ACTIVE_CLIENTS
- Verify the system JWT hasn't expired

### CORS Issues
- The API is configured to accept requests from localhost:3000 and localhost:5050
- Add your domain to CORS configuration in main.ts if needed