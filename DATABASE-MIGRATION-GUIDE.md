# AuthCakes Database Migration Guide

## Overview

This guide provides step-by-step instructions for migrating the AuthCakes database from the current 13-table schema to the comprehensive 48-table master schema. The migration system is designed to be safe, reversible, and transparent.

## Prerequisites

1. **Backup Your Database** (CRITICAL!)
   ```bash
   pg_dump -U postgres -d authcakes_dev > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Master Database**
   ```bash
   # Create the master database
   createdb -U postgres authcakes_master_dev
   
   # Update your .env file to include master DB connection
   MASTER_DB_HOST=localhost
   MASTER_DB_PORT=5432
   MASTER_DB_USERNAME=postgres
   MASTER_DB_PASSWORD=yourpassword
   MASTER_DB_DATABASE=authcakes_master_dev
   ```

4. **Run Master Schema Migrations**
   ```bash
   # Navigate to master_db_project
   cd master_db_project
   
   # Run migrations for master schema
   npm run migration:run:bp  # For best practices (plural tables)
   # OR
   npm run migration:run:orig  # For original (singular tables)
   
   cd ..
   ```

## Migration Commands

### 1. Setup Lookup Data (Required First Step)

Before migrating any data, you must set up the required lookup tables:

```bash
npm run cli setup-lookup-data
```

This creates:
- Account statuses (Active, Suspended, etc.)
- Account types (Standard, Premium, Enterprise)
- Cultures and timezones
- System configuration tables

Options:
- `--force` - Recreate lookup data even if it exists

### 2. Validate Pre-Migration State

Check your current database for any issues:

```bash
npm run cli validate --stage pre
```

This checks for:
- Orphaned records
- Duplicate emails
- Invalid data
- Missing required fields

### 3. Run the Migration

#### Full Migration (Recommended)

```bash
npm run cli migrate
```

This will:
1. Create a pre-migration checkpoint
2. Set up lookup data
3. Migrate users → account_logins + account_users
4. Migrate tenants → accounts
5. Set up security groups and privileges
6. Create a final checkpoint

#### Dry Run (Test First)

```bash
npm run cli migrate --dry-run
```

This simulates the migration without making any changes.

#### Partial Migration

```bash
# Migrate only specific types
npm run cli migrate --types USERS,TENANTS

# Available types:
# - LOOKUP_DATA
# - USERS
# - TENANTS
# - SECURITY
# - SESSIONS
# - API_KEYS
# - SETTINGS
```

#### Migration Options

- `--batch-size <number>` - Records per batch (default: 1000)
- `--continue-on-error` - Don't stop on errors
- `--dry-run` - Simulate without changes

### 4. Validate Post-Migration

```bash
npm run cli validate --stage post
```

This verifies:
- All records were migrated
- No data loss occurred
- Relationships are intact
- Security is properly configured

### 5. Generate Validation Report

```bash
npm run cli validate --report
```

Creates a detailed markdown report of the migration status.

## Rollback Procedures

### List Available Checkpoints

```bash
npm run cli rollback --list
```

### Rollback to Checkpoint

```bash
npm run cli rollback --checkpoint <checkpoint-id> --force
```

Checkpoints are created at:
- PRE_MIGRATION - Before any changes
- POST_LOOKUP - After lookup data setup
- POST_USERS - After user migration
- POST_TENANTS - After tenant migration
- POST_SECURITY - After security setup
- FINAL - Migration complete

## Migration Details

### User Migration

Current `users` table splits into:
- `account_logins` - Authentication data (email, password, MFA)
- `account_users` - Profile data (name, address, bio)

Key changes:
- Same user ID preserved in account_logins
- New ID generated for account_users
- Passwords remain encrypted
- All tokens preserved temporarily

### Tenant Migration

Current `tenants` become `accounts` with:
- Enhanced branding options
- Licensing support
- Multi-database capability
- Hierarchical organization support

### Security Migration

Simple roles (admin/user) convert to:
- Policy-based permissions
- Granular privileges
- Route-level access control
- Account-specific groups

## Troubleshooting

### Common Issues

1. **"Pre-migration validation failed"**
   - Fix any data integrity issues
   - Remove orphaned records
   - Ensure all users have emails

2. **"Migration count mismatch"**
   - Check for soft-deleted records
   - Verify foreign key constraints
   - Review migration logs

3. **"Timeout during migration"**
   - Reduce batch size
   - Increase database connection pool
   - Run partial migrations

### Viewing Logs

Migration logs are stored in the `migration_logs` table:

```sql
-- View all migration attempts
SELECT * FROM migration_logs ORDER BY started_at DESC;

-- Check specific migration
SELECT * FROM migration_logs WHERE type = 'USERS';

-- View errors
SELECT * FROM migration_logs WHERE status = 'failed';
```

## Post-Migration Steps

1. **Update Application Code**
   - Switch to new entities
   - Update authentication logic
   - Implement new security system

2. **Test Everything**
   - User login/logout
   - Tenant access
   - API key functionality
   - Admin features

3. **Monitor Performance**
   - Check query performance
   - Monitor connection pool
   - Watch for errors

4. **Plan Cleanup**
   - Archive old tables
   - Remove temporary columns
   - Update documentation

## Migration Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Preparation | 2 hours | Backup, setup, validation |
| Migration | 2-4 hours | Actual data migration |
| Validation | 1 hour | Post-migration checks |
| Testing | 2-4 hours | Application testing |
| Total | 7-11 hours | Complete migration |

## Safety Checklist

- [ ] Database backed up
- [ ] Maintenance mode enabled
- [ ] Team notified
- [ ] Rollback plan ready
- [ ] Test environment verified
- [ ] Monitoring enabled
- [ ] Support team on standby

## Support

If you encounter issues:

1. Check the troubleshooting section
2. Review migration logs
3. Run validation with `--detailed` flag
4. Create rollback checkpoint before attempting fixes
5. Contact the development team with:
   - Migration log ID
   - Error messages
   - Validation report

## Next Steps

After successful migration:

1. Review [MASTER-SCHEMA-ANALYSIS.md](./MASTER-SCHEMA-ANALYSIS.md) for new features
2. Update your application to use new entities
3. Implement enhanced security features
4. Enable new licensing capabilities
5. Plan for using advanced features

Remember: The migration is designed to be safe and reversible. Take your time, test thoroughly, and don't hesitate to rollback if needed.