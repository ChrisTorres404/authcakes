# API Version Migration Guide

## Overview

AuthCakes API has implemented URI-based versioning to ensure backward compatibility and enable gradual feature rollouts. All API endpoints are now prefixed with version identifiers (e.g., `/api/v1/`).

## Key Changes

### 1. Base URL Structure
- **Before**: `https://api.authcakes.com/auth/login`
- **After**: `https://api.authcakes.com/api/v1/auth/login`

### 2. Version Header
All responses now include an `X-API-Version` header indicating the API version being used.

## Migration Steps

### Step 1: Update Base URLs
Update your API client configuration to include the version prefix:

```javascript
// Before
const API_BASE_URL = 'https://api.authcakes.com';

// After
const API_BASE_URL = 'https://api.authcakes.com/api/v1';
```

### Step 2: Update Endpoint Paths
Update all API endpoint paths in your application:

```javascript
// Authentication Endpoints
OLD: POST /auth/login
NEW: POST /api/v1/auth/login

OLD: POST /auth/register
NEW: POST /api/v1/auth/register

OLD: POST /auth/logout
NEW: POST /api/v1/auth/logout

OLD: POST /auth/refresh
NEW: POST /api/v1/auth/refresh

// User Management
OLD: GET /users
NEW: GET /api/v1/users

OLD: GET /users/profile
NEW: GET /api/v1/users/profile

// Tenant Management
OLD: GET /tenants
NEW: GET /api/v1/tenants

OLD: POST /tenants
NEW: POST /api/v1/tenants

// Settings
OLD: GET /settings
NEW: GET /api/v1/settings

// API Keys
OLD: GET /api-keys
NEW: GET /api/v1/api-keys
```

### Step 3: Update SDK/Client Libraries

#### JavaScript/TypeScript
```typescript
import { AuthCakesClient } from '@authcakes/client';

const client = new AuthCakesClient({
  baseUrl: 'https://api.authcakes.com',
  version: 'v1', // Specify API version
  apiKey: 'your-api-key'
});
```

#### Python
```python
from authcakes import AuthCakesClient

client = AuthCakesClient(
    base_url='https://api.authcakes.com',
    version='v1',
    api_key='your-api-key'
)
```

#### cURL
```bash
# Before
curl -X POST https://api.authcakes.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# After
curl -X POST https://api.authcakes.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

## Testing Your Migration

1. **Update a single endpoint** in your test environment
2. **Verify the response** includes the `X-API-Version: v1` header
3. **Check response format** remains consistent
4. **Test error handling** for proper status codes
5. **Gradually migrate** remaining endpoints

## Backward Compatibility

**Important**: The non-versioned endpoints will be deprecated according to our deprecation policy. Please migrate to versioned endpoints as soon as possible.

## Common Issues and Solutions

### Issue 1: 404 Not Found Errors
**Cause**: Using old endpoint paths without version prefix
**Solution**: Ensure all endpoints include `/api/v1/` prefix

### Issue 2: Authentication Failures
**Cause**: CSRF token validation on new endpoints
**Solution**: Ensure your client properly handles CSRF tokens from response headers

### Issue 3: CORS Errors
**Cause**: Updated CORS policy for versioned endpoints
**Solution**: Ensure your frontend origin is whitelisted in CORS configuration

## Support

If you encounter any issues during migration:
1. Check the [API Documentation](https://api.authcakes.com/api/docs)
2. Review the [Changelog](https://github.com/authcakes/api/releases)
3. Contact support at support@authcakes.com

## Timeline

- **Current**: Version 1 (v1) is now available
- **6 months**: Non-versioned endpoints will show deprecation warnings
- **12 months**: Non-versioned endpoints will be removed

Please complete your migration within the next 6 months to avoid service disruption.