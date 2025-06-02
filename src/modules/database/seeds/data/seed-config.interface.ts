/**
 * @fileoverview Seed data configuration interfaces for different environments
 * Defines the structure for environment-specific seed data
 */

export interface SeedUser {
  email: string;
  password: string;
  role: string;
  active: boolean;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  mfaEnabled?: boolean;
  failedLoginAttempts?: number;
}

export interface SeedTenant {
  name: string;
  slug: string;
  active: boolean;
  settings?: Record<string, any>;
}

export interface SeedTenantMembership {
  userEmail: string;
  tenantSlug: string;
  role: string;
}

export interface SeedSystemSetting {
  key: string;
  value: string;
  type: string;
  description?: string;
}

export interface SeedApiKey {
  name: string;
  userEmail: string;
  tenantSlug?: string;
  permissions: Record<string, any>;
  active: boolean;
}

/**
 * Complete seed data configuration for an environment
 */
export interface SeedDataConfig {
  /**
   * Environment name (dev, test, prod)
   */
  environment: 'development' | 'test' | 'production';
  
  /**
   * System settings - always seeded
   */
  systemSettings: SeedSystemSetting[];
  
  /**
   * Users to seed
   */
  users: SeedUser[];
  
  /**
   * Tenants/Organizations to seed
   */
  tenants: SeedTenant[];
  
  /**
   * Tenant memberships
   */
  tenantMemberships: SeedTenantMembership[];
  
  /**
   * API keys (optional)
   */
  apiKeys?: SeedApiKey[];
  
  /**
   * Whether to seed additional demo data (MFA codes, devices, etc.)
   */
  includeDemoData: boolean;
}