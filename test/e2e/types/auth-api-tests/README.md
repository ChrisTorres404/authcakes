# Auth API Tests

Pure API tests designed from a frontend developer's perspective. These tests simulate real client applications consuming the AuthCakes API.

## Test Philosophy

- **Frontend-First**: Tests how a React/Vue/mobile app would interact with the API
- **HTTP-Only**: No internal imports or service layer dependencies
- **Contract Validation**: Ensures API contracts are maintained
- **Error Handling**: Validates user-friendly error messages and status codes
- **Integration Ready**: Tests work with any frontend framework

## Test Files

### `auth-api-basic.e2e-spec.ts`
Basic authentication flows that every client application needs:
- User registration with organization setup
- Login/logout flows
- Token handling and cookie management
- Session validation

### `auth-api-enterprise.e2e-spec.ts`
Enterprise security features for business applications:
- Advanced security headers
- Request tracking and monitoring
- Enterprise-level audit logging
- Compliance and governance features

### `auth-api-mfa.e2e-spec.ts`
Multi-factor authentication from a user experience perspective:
- MFA setup and enrollment flows
- TOTP code validation
- Recovery code management
- Mobile app MFA integration

### `auth-api-password.e2e-spec.ts`
Password management workflows:
- Password reset flows (forgot password)
- Password change (authenticated users)
- Password policy enforcement
- Email-based reset tokens

### `auth-api-recovery.e2e-spec.ts`
Account recovery for users who have lost all credentials:
- Complete account recovery process
- Security and privacy validation
- Rate limiting protection
- MFA integration for recovery
- Frontend routing compatibility
- Mobile app support

## Key Features Tested

✅ **API Contracts** - Request/response validation
✅ **Error Messages** - User-friendly frontend display
✅ **Security Headers** - CORS, cache control, request IDs  
✅ **Rate Limiting** - Abuse prevention
✅ **Mobile Compatibility** - Works without cookies
✅ **Frontend Routing** - SPA-friendly flows
✅ **Observability** - Request tracking and monitoring

## Running These Tests

```bash
# Run all API tests
npm run test:e2e -- test/e2e/types/auth-api-tests

# Run specific test
npm run test:e2e -- test/e2e/types/auth-api-tests/auth-api-recovery.e2e-spec.ts

# Run with verbose output
npm run test:e2e -- test/e2e/types/auth-api-tests --verbose
```

## For Frontend Developers

These tests demonstrate:
- Exact API endpoints and payloads
- Expected response formats
- Error handling patterns
- Header requirements
- Cookie vs token-based authentication
- CORS configuration

Use these tests as reference when implementing authentication in your frontend application.