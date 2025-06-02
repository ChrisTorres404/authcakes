/**
 * @fileoverview Test environment seed data
 * Minimal data required for e2e tests to run
 * Tests should create their own data for isolation
 */

import { SeedDataConfig } from './seed-config.interface';

export const testSeedData: SeedDataConfig = {
  environment: 'test',
  
  // System settings required for application to function
  systemSettings: [
    {
      key: 'auth.password.minLength',
      value: '8',
      type: 'number',
      description: 'Minimum password length',
    },
    {
      key: 'auth.password.requireNumbers',
      value: 'false',
      type: 'boolean',
      description: 'Require numbers in password',
    },
    {
      key: 'auth.password.requireSpecial',
      value: 'false',
      type: 'boolean',
      description: 'Require special characters in password',
    },
    {
      key: 'auth.password.requireUppercase',
      value: 'false',
      type: 'boolean',
      description: 'Require uppercase letters in password',
    },
    {
      key: 'auth.password.bcryptRounds',
      value: '10',
      type: 'number',
      description: 'Bcrypt hashing rounds',
    },
    {
      key: 'auth.jwt.accessExpiresIn',
      value: '900',
      type: 'number',
      description: 'Access token expiration in seconds',
    },
    {
      key: 'auth.jwt.refreshExpiresIn',
      value: '604800',
      type: 'number',
      description: 'Refresh token expiration in seconds',
    },
    {
      key: 'auth.mfa.enabled',
      value: 'false',
      type: 'boolean',
      description: 'MFA enabled by default',
    },
    {
      key: 'auth.session.timeout',
      value: '3600',
      type: 'number',
      description: 'Session timeout in seconds',
    },
  ],
  
  // No users - tests will create their own
  users: [],
  
  // No tenants - tests will create their own
  tenants: [],
  
  // No memberships
  tenantMemberships: [],
  
  // No API keys
  apiKeys: [],
  
  // No demo data for tests
  includeDemoData: false,
};