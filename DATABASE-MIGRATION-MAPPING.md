# Database Migration Mapping Document

## Overview

This document provides detailed field-by-field mapping between the current AuthCakes schema (13 tables) and the master schema (48 tables). It includes transformation rules, default values, and special handling requirements.

## Table Mapping Summary

| Current Table | Master Table(s) | Mapping Type | Complexity |
|--------------|-----------------|--------------|------------|
| users | account_logins + account_users | Split | High |
| tenants | accounts | Transform | Medium |
| tenant_memberships | account_management_group_members | Transform | High |
| sessions | (archived) + account_login_history | Archive + Track | Medium |
| refresh_tokens | (archived) | Archive | Low |
| password_history | account_login_password_history | Direct | Low |
| mfa_recovery_codes | (kept in account_logins) | Merge | Low |
| webauthn_credentials | (kept in account_logins) | Merge | Low |
| user_devices | account_login_history | Transform | Medium |
| api_keys | api_keys | Enhance | Low |
| logs | (kept as-is) | No change | None |
| system_settings | system_settings | Direct | Low |
| tenant_invitations | (custom handling) | Transform | Medium |

## Detailed Field Mappings

### 1. Users → Account Logins + Account Users

```typescript
// Transformation function
function migrateUser(user: CurrentUser): { login: AccountLogin, user: AccountUser } {
  return {
    login: {
      // Direct mappings
      id: user.id,
      email: user.email,
      password_hash: user.password,
      is_active: user.active,
      is_email_verified: user.emailVerified,
      is_phone_verified: user.phoneVerified,
      phone_number: user.phoneNumber,
      failed_login_attempts: user.failedLoginAttempts,
      is_locked: user.lockedUntil ? user.lockedUntil > new Date() : false,
      locked_until: user.lockedUntil,
      last_login_date: user.lastLogin,
      mfa_enabled: user.mfaEnabled,
      mfa_secret: user.mfaSecret,
      mfa_type: user.mfaType,
      
      // New required fields
      auth_source: 'local',
      auth_source_id: null,
      is_hard_locked: false,
      total_logins: 0, // Will be calculated from sessions
      total_lockouts: 0, // Will be calculated from logs
      total_failed_logins: user.failedLoginAttempts,
      
      // Tokens (temporary storage)
      temp_email_token: user.emailVerificationToken,
      temp_phone_token: user.phoneVerificationToken,
      temp_reset_token: user.resetToken,
      temp_reset_expiry: user.resetTokenExpiry,
      temp_recovery_token: user.accountRecoveryToken,
      temp_recovery_expiry: user.accountRecoveryTokenExpiry,
      
      // Audit fields
      date_created: user.createdAt,
      date_modified: user.updatedAt,
      created_by: 'migration',
      modified_by: 'migration',
      is_deleted: false
    },
    user: {
      // Generate new ID for account_user
      id: generateUUID(),
      account_login_id: user.id,
      
      // Direct mappings
      first_name: user.firstName,
      last_name: user.lastName,
      avatar_url: user.avatar,
      company: user.company,
      department: user.department,
      address: user.address,
      address2: user.address2,
      city: user.city,
      state_province: user.state,
      postal_code: user.zipCode,
      country: user.country,
      bio: user.bio,
      
      // New required fields
      middle_name: null,
      prefix: null,
      suffix: null,
      nickname: null,
      
      // Audit fields
      date_created: user.createdAt,
      date_modified: user.updatedAt,
      created_by: 'migration',
      modified_by: 'migration',
      is_deleted: false
    }
  };
}
```

#### Special Handling: User Roles

```typescript
// Current: user.role = 'admin' | 'user'
// Master: Requires security policy group assignment

async function migrateUserRole(userId: string, role: string, accountId: string) {
  // 1. Find or create appropriate security policy group
  const policyGroup = role === 'admin' 
    ? await findSystemPolicyGroup('SYSTEM_ADMIN')
    : await findSystemPolicyGroup('SYSTEM_USER');
  
  // 2. Create account management group
  const mgmtGroup = await createAccountManagementGroup({
    account_id: accountId,
    name: role === 'admin' ? 'Administrators' : 'Users',
    is_system: true
  });
  
  // 3. Assign user to group
  await addUserToGroup(userId, mgmtGroup.id);
  
  // 4. Assign privileges to group
  await assignGroupPrivileges(mgmtGroup.id, policyGroup.privileges);
}
```

### 2. Tenants → Accounts

```typescript
function migrateTenant(tenant: CurrentTenant): Account {
  return {
    // Direct mappings
    id: tenant.id,
    name: tenant.name,
    subdomain: tenant.slug,
    logo_url: tenant.logo,
    is_active: tenant.active,
    
    // Parse settings JSON
    ...parseTenantsSettings(tenant.settings),
    
    // New required fields
    account_status_id: getDefaultAccountStatusId('active'),
    account_type_id: getDefaultAccountTypeId('standard'),
    tenant_type_id: getDefaultTenantTypeId('organization'),
    friendly_name: tenant.name,
    legal_name: tenant.name, // Should be updated post-migration
    tax_id: null,
    date_established: tenant.createdAt,
    
    // Contact information (needs enrichment)
    email: null, // Should be set to primary admin email
    phone: null,
    fax: null,
    website: null,
    
    // Features and settings
    database_connection_string: null, // For multi-db support
    storage_connection_string: null,
    max_users: 0, // Unlimited
    max_storage_gb: 0, // Unlimited
    
    // Branding (extract from settings if available)
    theme_primary_color: tenant.settings?.theme?.primaryColor || '#1890ff',
    theme_secondary_color: tenant.settings?.theme?.secondaryColor || '#52c41a',
    custom_css: null,
    favicon_url: null,
    
    // Localization
    default_culture_id: getDefaultCultureId('en-US'),
    default_time_zone_id: getDefaultTimeZoneId('UTC'),
    
    // Audit fields
    date_created: tenant.createdAt,
    date_modified: tenant.updatedAt,
    created_by: 'migration',
    modified_by: 'migration',
    is_deleted: false,
    date_deleted: tenant.deletedAt,
    deleted_by: tenant.deletedAt ? 'unknown' : null
  };
}
```

### 3. Tenant Memberships → Account Management Groups

```typescript
async function migrateTenantMemberships(membership: TenantMembership) {
  // 1. Get the migrated account user
  const accountUser = await getAccountUserByLoginId(membership.user_id);
  
  // 2. Find or create role-based group
  const groupName = membership.role === 'admin' ? 'Administrators' : 'Members';
  const group = await findOrCreateAccountGroup(membership.tenant_id, groupName);
  
  // 3. Add user to group
  await createGroupMembership({
    id: generateUUID(),
    account_management_group_id: group.id,
    account_user_id: accountUser.id,
    
    // Audit fields
    date_created: membership.createdAt,
    date_modified: membership.updatedAt,
    created_by: 'migration',
    modified_by: 'migration',
    is_deleted: membership.deletedAt !== null
  });
  
  // 4. Ensure group has appropriate privileges
  await ensureGroupPrivileges(group.id, membership.role);
}
```

### 4. Sessions → Account Login History

```typescript
function migrateSession(session: CurrentSession): AccountLoginHistory | null {
  // Only migrate successful logins from sessions
  if (!session.userId) return null;
  
  return {
    id: generateUUID(),
    account_login_id: session.userId,
    login_date: session.createdAt,
    
    // Device information
    ip_address: session.ipAddress,
    user_agent: session.userAgent,
    
    // Geographic information (requires IP lookup)
    latitude: null, // TODO: Implement IP geolocation
    longitude: null,
    city: null,
    region: null,
    country: null,
    
    // Status
    is_successful: true, // Sessions only track successful logins
    failure_reason: null,
    
    // Session info
    session_id: session.id,
    session_duration_minutes: calculateDuration(session.createdAt, session.lastActivityAt),
    
    // Audit fields
    date_created: session.createdAt,
    created_by: 'migration',
    is_deleted: false
  };
}
```

### 5. API Keys Migration

```typescript
function migrateApiKey(apiKey: CurrentApiKey): MasterApiKey {
  return {
    // Direct mappings
    id: apiKey.id,
    account_id: apiKey.tenantId || null,
    name: apiKey.name,
    key: apiKey.key,
    is_active: apiKey.active,
    expires_at: apiKey.expiresAt,
    
    // Parse permissions
    permissions: apiKey.permissions || {},
    
    // New tracking fields
    rate_limit_per_hour: 1000, // Default rate limit
    last_used_at: null,
    last_used_ip: null,
    total_requests: 0,
    
    // Audit fields
    date_created: apiKey.createdAt,
    date_modified: apiKey.updatedAt,
    created_by: apiKey.userId,
    modified_by: apiKey.userId,
    is_deleted: false
  };
}
```

### 6. System Settings Migration

```typescript
function migrateSystemSetting(setting: CurrentSystemSetting): MasterSystemSetting {
  return {
    // Direct mappings
    id: generateUUID(),
    key: setting.key,
    value: setting.value,
    description: setting.description,
    
    // New fields
    data_type: setting.type || 'string',
    is_encrypted: false,
    is_system: true,
    category: categorizeSettingKey(setting.key),
    
    // Audit fields
    date_created: setting.createdAt,
    date_modified: setting.updatedAt,
    created_by: 'migration',
    modified_by: 'migration',
    is_deleted: false
  };
}
```

## Default Values and Lookups

### Required Lookup Data

```typescript
// These must be created before migration
const MIGRATION_DEFAULTS = {
  // Account Status
  accountStatus: {
    active: { id: 'uuid-1', name: 'Active', can_login: true },
    suspended: { id: 'uuid-2', name: 'Suspended', can_login: false },
    closed: { id: 'uuid-3', name: 'Closed', can_login: false }
  },
  
  // Account Types
  accountType: {
    standard: { id: 'uuid-4', name: 'Standard', code: 'STD' },
    premium: { id: 'uuid-5', name: 'Premium', code: 'PRM' },
    enterprise: { id: 'uuid-6', name: 'Enterprise', code: 'ENT' }
  },
  
  // Tenant Types
  tenantType: {
    organization: { id: 'uuid-7', name: 'Organization' },
    individual: { id: 'uuid-8', name: 'Individual' }
  },
  
  // Security Policy Groups
  securityPolicyGroups: {
    systemAdmin: { id: 'uuid-9', name: 'System Administrator' },
    systemUser: { id: 'uuid-10', name: 'System User' }
  },
  
  // Cultures
  culture: {
    enUS: { id: 'uuid-11', code: 'en-US', name: 'English (United States)' }
  },
  
  // Time Zones
  timeZone: {
    utc: { id: 'uuid-12', iana_id: 'UTC', name: 'Coordinated Universal Time' }
  }
};
```

## Migration Sequence

### Phase 1: Preparation
1. Create all lookup tables and seed data
2. Create migration tracking table
3. Backup current database
4. Set up parallel master database

### Phase 2: Core Data Migration
```sql
-- Order matters due to foreign key constraints
1. system_settings
2. users → account_logins + account_users
3. tenants → accounts
4. Create default account_management_groups
5. tenant_memberships → account_management_group_members
6. password_history → account_login_password_history
7. api_keys → api_keys (enhanced)
```

### Phase 3: Session and History Migration
```sql
1. sessions → account_login_history (extract successful logins)
2. user_devices → account_login_history (merge device info)
3. logs → keep as-is (compatibility)
4. Archive refresh_tokens (no direct mapping)
```

### Phase 4: Post-Migration Tasks
1. Set up security privileges and routes
2. Assign default module subscriptions
3. Create organization hierarchies
4. Validate data integrity
5. Update sequences and constraints

## Data Validation Queries

### Pre-Migration Validation
```sql
-- Check for orphaned records
SELECT COUNT(*) FROM tenant_memberships tm 
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = tm.user_id)
   OR NOT EXISTS (SELECT 1 FROM tenants t WHERE t.id = tm.tenant_id);

-- Check for duplicate emails
SELECT email, COUNT(*) FROM users 
GROUP BY email HAVING COUNT(*) > 1;

-- Check for invalid role values
SELECT DISTINCT role FROM users 
WHERE role NOT IN ('admin', 'user');
```

### Post-Migration Validation
```sql
-- Verify user split
SELECT COUNT(*) as login_count FROM account_logins;
SELECT COUNT(*) as user_count FROM account_users;
-- Both should equal original users count

-- Verify no orphaned account_users
SELECT COUNT(*) FROM account_users au
WHERE NOT EXISTS (
  SELECT 1 FROM account_logins al 
  WHERE al.id = au.account_login_id
);

-- Verify group memberships
SELECT 
  a.name as account_name,
  amg.name as group_name,
  COUNT(amgm.id) as member_count
FROM accounts a
JOIN account_management_groups amg ON amg.account_id = a.id
LEFT JOIN account_management_group_members amgm ON amgm.account_management_group_id = amg.id
GROUP BY a.id, amg.id;
```

## Rollback Strategy

### Rollback Points
1. **Pre-Migration Backup**: Full database backup before any changes
2. **Post-Lookup Creation**: After creating reference data
3. **Post-User Migration**: After splitting users table
4. **Post-Tenant Migration**: After converting tenants
5. **Final State**: Complete migration

### Rollback Scripts
```sql
-- Example: Rollback user split
INSERT INTO users (id, email, password, role, ...)
SELECT 
  al.id,
  al.email,
  al.password_hash,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM account_management_group_members amgm
      JOIN account_management_groups amg ON amg.id = amgm.account_management_group_id
      WHERE amgm.account_user_id = au.id AND amg.name = 'Administrators'
    ) THEN 'admin'
    ELSE 'user'
  END as role,
  au.first_name,
  au.last_name,
  ...
FROM account_logins al
JOIN account_users au ON au.account_login_id = al.id;
```

## Performance Considerations

### Batch Processing
```typescript
const BATCH_SIZE = 1000;

async function batchMigrate<T, R>(
  items: T[],
  transformer: (item: T) => R,
  inserter: (items: R[]) => Promise<void>
) {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const transformed = batch.map(transformer);
    await inserter(transformed);
    
    console.log(`Migrated ${i + batch.length} of ${items.length} items`);
  }
}
```

### Index Management
```sql
-- Drop indexes before bulk insert
ALTER TABLE account_logins DROP INDEX idx_email;
ALTER TABLE account_users DROP INDEX idx_account_login_id;

-- Bulk insert data

-- Recreate indexes
CREATE UNIQUE INDEX idx_email ON account_logins(email);
CREATE INDEX idx_account_login_id ON account_users(account_login_id);
```

## Success Criteria

### Functional Validation
- [ ] All users can log in with existing credentials
- [ ] All tenant memberships are preserved
- [ ] API keys continue to work
- [ ] Admin users retain admin access
- [ ] Audit trails are maintained

### Data Integrity
- [ ] No data loss (row counts match)
- [ ] No orphaned records
- [ ] All foreign keys valid
- [ ] No duplicate keys
- [ ] Timestamps preserved

### Performance Metrics
- [ ] Login performance ≤ current baseline
- [ ] API response times maintained
- [ ] Database query performance stable
- [ ] No connection pool exhaustion

## Migration Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Preparation | 2 days | Create scripts, test environment |
| Dry Run | 1 day | Test migration on copy |
| Production Prep | 4 hours | Backups, maintenance mode |
| Migration | 2-4 hours | Execute migration |
| Validation | 2 hours | Run all checks |
| Cutover | 1 hour | Switch applications |
| Monitoring | 48 hours | Close observation |

Total estimated downtime: 4-6 hours (can be reduced with blue-green deployment)