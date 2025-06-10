# AuthCakes API Client Migration Guide

## Overview

This guide provides step-by-step instructions for migrating your client applications to use the new versioned API endpoints. All API endpoints are now prefixed with `/api/v1/` to support future API versioning.

## Migration Timeline

- **Current**: Both legacy and v1 endpoints are supported
- **3 months**: Legacy endpoints will show deprecation warnings
- **6 months**: Legacy endpoints will be removed

## Base URL Changes

### Before
```
https://api.authcakes.com/auth/login
https://api.authcakes.com/users/profile
https://api.authcakes.com/tenants
```

### After
```
https://api.authcakes.com/api/v1/auth/login
https://api.authcakes.com/api/v1/users/profile
https://api.authcakes.com/api/v1/tenants
```

## Client Migration Examples

### JavaScript/TypeScript (Axios)

#### Before
```typescript
const API_BASE_URL = 'https://api.authcakes.com';

const authApi = {
  login: (credentials) => 
    axios.post(`${API_BASE_URL}/auth/login`, credentials),
  
  getProfile: () =>
    axios.get(`${API_BASE_URL}/users/profile`),
    
  refreshToken: (token) =>
    axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken: token })
};
```

#### After
```typescript
const API_BASE_URL = 'https://api.authcakes.com/api/v1';

const authApi = {
  login: (credentials) => 
    axios.post(`${API_BASE_URL}/auth/login`, credentials),
  
  getProfile: () =>
    axios.get(`${API_BASE_URL}/users/profile`),
    
  refreshToken: (token) =>
    axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken: token })
};
```

### Python (Requests)

#### Before
```python
import requests

BASE_URL = "https://api.authcakes.com"

def login(email, password):
    return requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password}
    )

def get_user_profile(token):
    return requests.get(
        f"{BASE_URL}/users/profile",
        headers={"Authorization": f"Bearer {token}"}
    )
```

#### After
```python
import requests

BASE_URL = "https://api.authcakes.com/api/v1"

def login(email, password):
    return requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password}
    )

def get_user_profile(token):
    return requests.get(
        f"{BASE_URL}/users/profile",
        headers={"Authorization": f"Bearer {token}"}
    )
```

### cURL Examples

#### Before
```bash
# Login
curl -X POST https://api.authcakes.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get Profile
curl -X GET https://api.authcakes.com/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### After
```bash
# Login
curl -X POST https://api.authcakes.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get Profile
curl -X GET https://api.authcakes.com/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Environment-Based Configuration

We recommend using environment variables for API configuration:

```javascript
// .env file
AUTHCAKES_API_VERSION=v1
AUTHCAKES_API_BASE_URL=https://api.authcakes.com

// client.js
const API_VERSION = process.env.AUTHCAKES_API_VERSION || 'v1';
const BASE_URL = process.env.AUTHCAKES_API_BASE_URL;
const API_URL = `${BASE_URL}/api/${API_VERSION}`;
```

## Response Headers

All API responses now include version information:

```
X-API-Version: v1
X-API-Deprecation: false
X-API-Sunset: 2024-12-31 (only if endpoint is deprecated)
```

## Handling Deprecation Warnings

Monitor response headers for deprecation notices:

```typescript
axios.interceptors.response.use(
  (response) => {
    const deprecation = response.headers['x-api-deprecation'];
    const sunset = response.headers['x-api-sunset'];
    
    if (deprecation === 'true') {
      console.warn(`API endpoint deprecated. Sunset date: ${sunset}`);
      // Log to monitoring service
    }
    
    return response;
  }
);
```

## SDK Updates

If you're using an official AuthCakes SDK:

### Node.js SDK
```bash
npm update @authcakes/sdk@latest
```

### Python SDK
```bash
pip install --upgrade authcakes-sdk
```

## Testing Your Migration

1. **Update Base URLs**: Change all API base URLs to include `/api/v1`
2. **Test Authentication Flow**: Verify login, token refresh, and logout
3. **Test Core Features**: Ensure all API calls work with new endpoints
4. **Monitor Logs**: Check for any deprecation warnings
5. **Update Documentation**: Update your internal docs with new endpoints

## Rollback Plan

If you encounter issues during migration:

1. Legacy endpoints remain available during transition
2. No authentication changes required
3. Simply revert base URL changes to rollback

## Common Issues and Solutions

### Issue: 404 Not Found
**Solution**: Ensure you've added both `/api` and `/v1` to your base URL

### Issue: CORS Errors
**Solution**: The new endpoints support the same CORS configuration. Clear browser cache.

### Issue: Authentication Failures
**Solution**: Token format and authentication headers remain unchanged

## Support

For migration assistance:
- Email: support@authcakes.com
- Documentation: https://docs.authcakes.com/api/v1
- Status Page: https://status.authcakes.com

## Changelog

### Version 1.0.0 (Current)
- Initial versioned API release
- All endpoints moved to `/api/v1/` prefix
- No breaking changes to request/response formats
- Added version headers to all responses