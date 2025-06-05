# E2E Test Organization

This directory contains organized end-to-end tests for the AuthCakes API, categorized by functionality and testing approach.

## Directory Structure

### `/auth-api-tests/`
**Pure API Tests** - Frontend-focused tests that simulate real client applications
- Tests HTTP endpoints as they would be consumed by web/mobile apps
- No internal imports or service layer dependencies
- Focus on request/response validation, error handling, and API contracts
- Ideal for frontend developers and API documentation

**Files:**
- `auth-api-basic.e2e-spec.ts` - Basic authentication flows
- `auth-api-enterprise.e2e-spec.ts` - Enterprise security features
- `auth-api-mfa.e2e-spec.ts` - Multi-factor authentication
- `auth-api-password.e2e-spec.ts` - Password management
- `auth-api-recovery.e2e-spec.ts` - Account recovery flows

### `/auth-core-tests/`
**Core Authentication Tests** - Internal system testing with full access to services
- Tests business logic and internal implementations
- Uses service layer imports and direct database access
- Focus on edge cases, security validation, and system integration
- Ideal for backend developers and system validation

**Files:**
- `auth-basic.e2e-spec.ts` - Basic authentication functionality
- `auth-mfa.e2e-spec.ts` - MFA system integration
- `auth-password-enterprise.e2e-spec.ts` - Enterprise password policies
- `auth-password.e2e-spec.ts` - Password management system
- `auth-recovery.e2e-spec.ts` - Account recovery system
- `auth-session.e2e-spec.ts` - Session management
- `auth-tokens.e2e-spec.ts` - Token lifecycle management
- `auth-verification.e2e-spec.ts` - Email/phone verification

### `/tenant-tests/`
**Multi-Tenant System Tests** - Organization and tenant management
- Tests tenant isolation and multi-tenancy features
- Organization management and user roles within tenants
- Cross-tenant security validation

**Files:**
- `tenants.e2e-spec.ts` - Tenant management and isolation

### `/system-tests/`
**System-Level Tests** - Infrastructure and cross-cutting concerns
- Rate limiting and throttling
- System health and monitoring
- Performance and load testing

**Files:**
- `throttle.e2e-spec.ts` - Rate limiting and abuse prevention

## Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run by Category
```bash
# API Tests (Frontend-focused)
npm run test:e2e -- test/e2e/types/auth-api-tests

# Core Tests (Backend-focused)
npm run test:e2e -- test/e2e/types/auth-core-tests

# Tenant Tests
npm run test:e2e -- test/e2e/types/tenant-tests

# System Tests
npm run test:e2e -- test/e2e/types/system-tests
```

### Run Specific Test File
```bash
npm run test:e2e -- test/e2e/types/auth-api-tests/auth-api-recovery.e2e-spec.ts
```

## Test Development Guidelines

### API Tests (`/auth-api-tests/`)
- ✅ Use only HTTP requests (supertest)
- ✅ Test from frontend developer perspective
- ✅ Focus on API contracts and error messages
- ❌ No internal service imports
- ❌ No direct database manipulation

### Core Tests (`/auth-core-tests/`)
- ✅ Full access to services and repositories
- ✅ Test business logic edge cases
- ✅ Direct database validation
- ✅ Internal system integration testing

### Test Naming Convention
- API Tests: `auth-api-[feature].e2e-spec.ts`
- Core Tests: `auth-[feature].e2e-spec.ts`
- Tenant Tests: `tenants.e2e-spec.ts`, `tenant-[feature].e2e-spec.ts`
- System Tests: `[system-feature].e2e-spec.ts`

## Benefits of This Organization

1. **Clear Separation of Concerns** - API vs Core vs System testing
2. **Frontend/Backend Developer Focus** - Different test types for different roles
3. **Easier Maintenance** - Related tests grouped together
4. **Scalable Structure** - Easy to add new test categories
5. **CI/CD Optimization** - Can run different test suites in parallel