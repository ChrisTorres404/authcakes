# Auth Core Tests

Comprehensive authentication system tests with full access to internal services and database. These tests validate business logic, security implementations, and system integration.

## Test Philosophy

- **System Integration**: Tests the complete authentication system end-to-end
- **Business Logic**: Validates complex workflows and edge cases
- **Security Validation**: Ensures enterprise-level security requirements
- **Database Integration**: Direct validation of data persistence and integrity
- **Service Layer Testing**: Uses internal imports to test business logic

## Test Files

### `auth-basic.e2e-spec.ts`
Core authentication functionality with system-level validation:
- User registration and account setup
- Login/logout with session management
- Database integrity validation
- Service layer integration

### `auth-mfa.e2e-spec.ts`
Multi-factor authentication system integration:
- TOTP secret generation and storage
- MFA enforcement policies
- Recovery code system validation
- Database security for MFA data

### `auth-password-enterprise.e2e-spec.ts`
Enterprise password policies and security:
- Complex password policy enforcement
- Password history tracking and validation
- Account lockout mechanisms
- Enterprise security compliance

### `auth-password.e2e-spec.ts`
Password management system validation:
- Password reset token generation and expiry
- OTP system integration
- Email notification system
- Security edge cases and token reuse prevention

### `auth-recovery.e2e-spec.ts`
Account recovery system with comprehensive security testing:
- Recovery token lifecycle management
- MFA integration during recovery
- Token expiration and invalidation
- Security edge cases and abuse prevention
- Database transaction integrity

### `auth-session.e2e-spec.ts`
Session management and lifecycle:
- Session creation and validation
- Session expiry and cleanup
- Multi-device session handling
- Security monitoring and audit trails

### `auth-tokens.e2e-spec.ts`
Token lifecycle and security management:
- JWT token generation and validation
- Refresh token rotation
- Token revocation and blacklisting
- Security monitoring and abuse detection

### `auth-verification.e2e-spec.ts`
Email and phone verification systems:
- Verification token generation
- Email/SMS integration
- Verification flow validation
- Security and anti-spam measures

## Key Features Tested

✅ **Database Integrity** - Data persistence and consistency
✅ **Business Logic** - Complex workflows and edge cases
✅ **Security Implementation** - Token security, encryption, hashing
✅ **Service Integration** - Cross-service communication
✅ **Error Handling** - Internal error scenarios
✅ **Performance** - Database queries and optimization
✅ **Audit Trails** - Security logging and monitoring
✅ **Transaction Safety** - Database transaction integrity

## Running These Tests

```bash
# Run all core authentication tests
npm run test:e2e -- test/e2e/types/auth-core-tests

# Run specific test category
npm run test:e2e -- test/e2e/types/auth-core-tests/auth-recovery.e2e-spec.ts

# Run with database logging
NODE_ENV=test npm run test:e2e -- test/e2e/types/auth-core-tests --verbose
```

## For Backend Developers

These tests validate:
- Service layer implementations
- Database schema and relationships
- Security algorithm implementations
- Business rule enforcement
- Error handling and edge cases
- Performance and scalability concerns

Use these tests to ensure system integrity and security compliance.