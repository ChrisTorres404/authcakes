/**
 * @fileoverview Shared type definitions for E2E tests
 * Contains interfaces and types used across multiple test files
 */

import { Response } from 'supertest';
import { User } from '../../../src/modules/users/entities/user.entity';

/**
 * MFA type options
 */
export type MfaType = 'totp' | 'sms' | 'email';

/**
 * MFA enrollment request
 */
export interface MfaEnrollRequest {
  type: MfaType;
  phoneNumber?: string; // for SMS
}

/**
 * MFA enrollment response
 */
export interface MfaEnrollResponse {
  secret: string;
  qrCode?: string;
  recoveryKeys?: string[];
  setupStatus: 'pending' | 'complete';
}

/**
 * MFA verification request
 */
export interface MfaVerifyRequest {
  code: string;
  type?: MfaType;
}

/**
 * MFA verification response
 */
export interface MfaVerifyResponse {
  success: boolean;
  message: string;
  remainingAttempts?: number;
}

/**
 * MFA recovery code verification
 */
export interface MfaRecoveryRequest {
  recoveryCode: string;
}

/**
 * MFA setup status
 * Reflects the MFA configuration state from the User entity
 */
export interface MfaSetupStatus {
  enabled: boolean;
  type?: MfaType;
  secret?: string;
  recoveryCodes?: Array<{
    id: string;
    code: string;
    used: boolean;
  }>;
}

/**
 * Account status information
 */
export interface AccountStatusInfo {
  active: boolean;
  lockedUntil?: Date | null;
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt?: Date;
}

/**
 * Password reset request payload
 */
export interface ForgotPasswordPayload {
  email: string;
}

/**
 * Password reset completion payload
 */
export interface ResetPasswordPayload {
  token: string;
  password: string;
  otp?: string;
}

/**
 * Password reset response
 */
export interface PasswordResetResponse {
  success: boolean;
  message: string;
  requiresOtp?: boolean;
}

/**
 * Password validation error details
 */
export interface PasswordValidationError extends ErrorResponse {
  details?: {
    minLength?: boolean;
    uppercase?: boolean;
    lowercase?: boolean;
    number?: boolean;
    special?: boolean;
  };
}

/**
 * Account status error
 */
export interface AccountStatusError extends ErrorResponse {
  status: {
    isLocked?: boolean;
    isDeactivated?: boolean;
    lockedUntil?: string;
    reason?: string;
  };
}

/**
 * Test user registration data
 */
export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

/**
 * Authentication response structure
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    emailVerified?: boolean;
    mfaEnabled?: boolean;
    mfaType?: MfaType;
    mfaVerified?: boolean;
  };
  accessToken: string;
  mfaRequired?: boolean;
}

/**
 * Cookie name-value mapping
 */
export interface CookieMap {
  [key: string]: string;
}

/**
 * JWT payload structure
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
  sessionId?: string;
  deviceId?: string;
}

/**
 * Token response structure
 */
export interface TokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse extends TokenResponse {
  refreshToken?: string;
}

/**
 * Session information
 */
export interface SessionInfo {
  id: string;
  userId: string;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
  };
  createdAt: string;
  lastUsedAt: string;
  isCurrentSession: boolean;
}

/**
 * Session list response
 */
export interface SessionListResponse {
  sessions: SessionInfo[];
  currentSession: SessionInfo;
}

/**
 * Password change payload
 */
export interface PasswordChangePayload {
  oldPassword: string;
  newPassword: string;
}

/**
 * Token revocation response
 */
export interface TokenRevocationResponse {
  success: boolean;
  message: string;
  revokedTokens?: number;
  revokedSessions?: number;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  timestamp?: string;
  path?: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Extended supertest Response type with common auth properties
 */
export interface AuthTestResponse extends Response {
  body: AuthResponse | ErrorResponse;
}

/**
 * Test context interface for sharing data between tests
 */
export interface TestContext {
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
  cookies?: CookieMap;
}

/**
 * Social login provider types
 */
export type SocialProvider = 'google' | 'github' | 'facebook';

/**
 * Social login request payload
 */
export interface SocialLoginPayload {
  provider: SocialProvider;
  token: string;
}

/**
 * Helper type for cookie extraction
 */
export type CookieHeader = string | string[] | undefined;
