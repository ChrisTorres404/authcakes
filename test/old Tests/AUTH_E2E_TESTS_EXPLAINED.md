# Auth E2E v2 Test Suite Explained

This document explains the purpose, structure, and individual test cases found in [`auth.e2e-spec.v2.ts`](./auth.e2e-spec.v2.ts), which is an enterprise-level end-to-end (E2E) test suite for the Auth module of the AuthCakes API (NestJS backend).

---

## Overview

This file contains comprehensive E2E tests for authentication, authorization, and related security/user flows. It is designed to:
- Ensure all critical authentication and user management features work as expected.
- Simulate real-world scenarios, including edge cases and security threats.
- Validate enterprise-level features such as session management, brute-force protection, MFA, device management, and audit logging.

The tests use [supertest](https://github.com/visionmedia/supertest) to simulate HTTP requests against a running NestJS application, covering both happy paths and failure scenarios.

---

## How the Tests Work

- **Setup:**
  - The test suite spins up a full NestJS application using the real `AppModule`.
  - Global prefix (`/api`) and validation pipes are set up as in production.
  - Each test uses unique emails to avoid conflicts.
- **Test Flow:**
  - Each `it` block represents a scenario (registration, login, password reset, etc.).
  - Tests use HTTP requests to interact with the API, checking both responses and side effects (cookies, tokens, etc.).
  - Many tests simulate both success and failure cases, including security edge cases.
- **Teardown:**
  - The app is closed after all tests.

---

## List of Tests and Descriptions

1. **Register, Login, Access Protected Route, Refresh Token, and Logout**
   - Simulates a full user journey: registration, login, accessing a protected route, refreshing the token, and logging out. Verifies cookies and user data.

2. **Login with Invalid Credentials**
   - Ensures login fails with incorrect email or password.

3. **Access Protected Route Without Token**
   - Verifies that protected endpoints cannot be accessed without authentication.

4. **Refresh with Revoked Token (After Logout)**
   - Checks that refresh tokens are invalidated after logout.

5. **Registration with Duplicate Email**
   - Ensures duplicate email registration is rejected.

6. **Account Lock After Multiple Failed Logins (Brute Force Protection)**
   - Simulates repeated failed logins and checks that the account is locked after too many attempts.

7. **Access Protected Route with Expired Access Token**
   - Simulates an expired JWT and ensures access is denied.

8. **Password Reset Flow**
   - Covers requesting a password reset, using a reset token, and logging in with the new password.

9. **Email Verification Flow**
   - Simulates email verification using a token after registration.

10. **Phone Verification Flow**
    - Simulates phone number verification using a token after registration.

11. **MFA Enrollment and Verification Flow**
    - Simulates enrolling in multi-factor authentication (MFA) and verifying with a code.

12. **Social Login Flow**
    - Simulates a social login callback (e.g., Google) with a mock provider response.

13. **Account Recovery Flow**
    - Covers requesting account recovery, using a recovery token, and logging in with a new password.

14. **Device Management Flow**
    - Tests listing devices and revoking a device/session.

15. **Session Expiration (Simulated by Revoking Session)**
    - Simulates session expiration by revoking a session and ensuring access is denied afterward.

16. **Audit Log Events**
    - Verifies that audit logs can be accessed and are returned as an array.

17. **Refresh Token Creation for Non-Existent or Revoked Session**
    - Ensures refresh tokens cannot be created for revoked or non-existent sessions.

18. **Session Expiry After Inactivity (Simulated Timeout)**
    - Simulates session timeout and ensures access is denied after inactivity.

19. **Revoke All Tokens and Sessions on Password Change**
    - Ensures all sessions/tokens are revoked after a password change, and only the new password works.

20. **Session Isolation Across Devices and Revocation**
    - Tests that sessions are isolated per device and that revoking one session does not affect others.

21. **Reject Forged or Tampered Tokens/Cookies**
    - Ensures the API rejects forged JWTs and tampered cookies.

22. **Structured Error Responses Without Sensitive Info**
    - Verifies that error responses do not leak sensitive information (e.g., passwords, tokens, stack traces).

---

## Notes
- Some endpoints (MFA, audit logs, social login) may be partially mocked or not fully implemented in the backend.
- The test suite is designed for extensibility and can be adapted as new features are added.

---

**File:** [`auth.e2e-spec.v2.ts`](./auth.e2e-spec.v2.ts) 