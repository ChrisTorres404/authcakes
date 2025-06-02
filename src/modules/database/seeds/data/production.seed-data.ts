/**
 * @fileoverview Production environment seed data
 * Only essential system configuration - no user data
 */

import { SeedDataConfig } from './seed-config.interface';

export const productionSeedData: SeedDataConfig = {
  environment: 'production',
  
  // Essential system settings only
  systemSettings: [
    {
      key: 'auth.password.minLength',
      value: '12', // Stronger for production
      type: 'number',
      description: 'Minimum password length',
    },
    {
      key: 'auth.password.requireNumbers',
      value: 'true', // Stronger for production
      type: 'boolean',
      description: 'Require numbers in password',
    },
    {
      key: 'auth.password.requireSpecial',
      value: 'true', // Stronger for production
      type: 'boolean',
      description: 'Require special characters in password',
    },
    {
      key: 'auth.password.requireUppercase',
      value: 'true', // Stronger for production
      type: 'boolean',
      description: 'Require uppercase letters in password',
    },
    {
      key: 'auth.password.bcryptRounds',
      value: '12', // Stronger for production
      type: 'number',
      description: 'Bcrypt hashing rounds',
    },
    {
      key: 'auth.jwt.accessExpiresIn',
      value: '900', // 15 minutes
      type: 'number',
      description: 'Access token expiration in seconds',
    },
    {
      key: 'auth.jwt.refreshExpiresIn',
      value: '2592000', // 30 days
      type: 'number',
      description: 'Refresh token expiration in seconds',
    },
    {
      key: 'auth.mfa.enabled',
      value: 'true', // Enforce MFA in production
      type: 'boolean',
      description: 'MFA enabled by default',
    },
    {
      key: 'auth.session.timeout',
      value: '3600', // 1 hour
      type: 'number',
      description: 'Session timeout in seconds',
    },
    {
      key: 'auth.accountRecovery.expiresIn',
      value: '3600', // 1 hour
      type: 'number',
      description: 'Account recovery token expiration in seconds',
    },
    {
      key: 'auth.accountVerification.required',
      value: 'true', // Enforce email verification in production
      type: 'boolean',
      description: 'Email verification required',
    },
    {
      key: 'auth.security.maxFailedAttempts',
      value: '5',
      type: 'number',
      description: 'Maximum failed login attempts before lockout',
    },
    {
      key: 'auth.security.lockDuration',
      value: '1800', // 30 minutes
      type: 'number',
      description: 'Account lock duration in seconds',
    },
    {
      key: 'auth.profileUpdate.restrictedFields',
      value: '["email","role","active","emailVerified"]',
      type: 'json',
      description: 'Fields that cannot be updated by users',
    },
  ],
  
  // No users in production
  users: [],
  
  // No tenants in production
  tenants: [],
  
  // No memberships in production
  tenantMemberships: [],
  
  // No API keys in production
  apiKeys: [],
  
  // No demo data in production
  includeDemoData: false,
};