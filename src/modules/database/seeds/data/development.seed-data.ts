/**
 * @fileoverview Development environment seed data
 * Full demo data for development and testing purposes
 */

import { SeedDataConfig } from './seed-config.interface';

export const developmentSeedData: SeedDataConfig = {
  environment: 'development',
  
  // System settings
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
    {
      key: 'auth.accountRecovery.expiresIn',
      value: '3600',
      type: 'number',
      description: 'Account recovery token expiration in seconds',
    },
    {
      key: 'auth.accountVerification.required',
      value: 'false',
      type: 'boolean',
      description: 'Email verification required',
    },
    {
      key: 'auth.profileUpdate.restrictedFields',
      value: '["email","role"]',
      type: 'json',
      description: 'Fields that cannot be updated by users',
    },
  ],
  
  // Demo users
  users: [
    {
      email: 'admin@authcakes.com',
      password: 'Admin123!',
      role: 'admin',
      active: true,
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: true,
      mfaEnabled: true,
    },
    {
      email: 'user@authcakes.com',
      password: 'User123!',
      role: 'user',
      active: true,
      firstName: 'Regular',
      lastName: 'User',
      emailVerified: true,
      mfaEnabled: false,
    },
    {
      email: 'john.doe@example.com',
      password: 'Password123!',
      role: 'user',
      active: true,
      firstName: 'John',
      lastName: 'Doe',
      emailVerified: true,
    },
    {
      email: 'jane.smith@example.com',
      password: 'Password123!',
      role: 'user',
      active: true,
      firstName: 'Jane',
      lastName: 'Smith',
      emailVerified: false,
    },
    {
      email: 'inactive@example.com',
      password: 'Inactive123!',
      role: 'user',
      active: false,
      firstName: 'Inactive',
      lastName: 'Account',
      emailVerified: true,
    },
  ],
  
  // Demo tenants
  tenants: [
    {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      active: true,
      settings: {
        theme: 'light',
        features: {
          sso: true,
          apiAccess: true,
        },
      },
    },
    {
      name: 'StartUp Inc',
      slug: 'startup-inc',
      active: true,
      settings: {
        theme: 'dark',
        features: {
          sso: false,
          apiAccess: true,
        },
      },
    },
    {
      name: 'Enterprise Solutions',
      slug: 'enterprise-solutions',
      active: true,
      settings: {
        theme: 'light',
        features: {
          sso: true,
          apiAccess: true,
          advancedReporting: true,
        },
      },
    },
  ],
  
  // Demo memberships
  tenantMemberships: [
    {
      userEmail: 'admin@authcakes.com',
      tenantSlug: 'acme-corp',
      role: 'admin',
    },
    {
      userEmail: 'admin@authcakes.com',
      tenantSlug: 'enterprise-solutions',
      role: 'owner',
    },
    {
      userEmail: 'user@authcakes.com',
      tenantSlug: 'acme-corp',
      role: 'member',
    },
    {
      userEmail: 'john.doe@example.com',
      tenantSlug: 'acme-corp',
      role: 'member',
    },
    {
      userEmail: 'john.doe@example.com',
      tenantSlug: 'startup-inc',
      role: 'admin',
    },
    {
      userEmail: 'jane.smith@example.com',
      tenantSlug: 'startup-inc',
      role: 'member',
    },
  ],
  
  // Demo API keys
  apiKeys: [
    {
      name: 'Development API Key',
      userEmail: 'admin@authcakes.com',
      tenantSlug: 'acme-corp',
      permissions: {
        read: true,
        write: true,
        delete: false,
      },
      active: true,
    },
    {
      name: 'Read-Only API Key',
      userEmail: 'user@authcakes.com',
      tenantSlug: 'acme-corp',
      permissions: {
        read: true,
        write: false,
        delete: false,
      },
      active: true,
    },
  ],
  
  // Include additional demo data
  includeDemoData: true,
};