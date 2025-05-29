/**
 * @fileoverview Entry point for E2E test suites
 *
 * This file serves as the main entry point for all end-to-end test suites,
 * particularly focusing on authentication-related functionality. The test files
 * are organized by feature area:
 *
 * - Basic Authentication (login, register)
 * - Token Management (refresh, revoke)
 * - Password Operations (change, reset)
 * - Account Verification
 * - Multi-Factor Authentication
 * - Session Management
 * - Account Recovery
 */

import './auth-basic.e2e-spec';
import './auth-mfa.e2e-spec';
import './auth-password.e2e-spec';
import './auth-recovery.e2e-spec';
import './auth-session.e2e-spec';
import './auth-tokens.e2e-spec';
import './auth-verification.e2e-spec';
