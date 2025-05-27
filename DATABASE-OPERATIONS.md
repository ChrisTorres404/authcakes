# Database Operations Guide

This guide explains how to work with migrations and seeders in the AuthCakes NestJS application.

## Understanding Migration and Seeding Issues

We've identified and fixed several issues related to database migrations and seeding:

1. **Seeders Only Run on Empty Tables**: By design, seeders check if tables are empty before inserting data. If any data exists, the seeder skips insertion.
2. **Environment Variable Requirements**: Migrations and seeders require specific environment variables to connect to the database.
3. **TypeORM Configuration**: Ensuring TypeORM CLI picks up the correct configuration.

## New CLI Commands

We've added several new CLI commands to help manage database operations:

### 1. Verify Database Connection

```bash
npm run db:verify
```

This command checks:
- If environment variables are correctly set
- If the database connection is working
- If required tables exist
- If tables have data

Use this command to diagnose connection issues before running migrations or seeders.

### 2. Truncate Tables

```bash
# Truncate specific tables
npm run db:truncate -- --tables users,tenants --confirm

# Truncate all seedable tables
npm run db:truncate -- --all --confirm
```

This command allows you to empty specific tables without dropping the entire database. Use it when you want to reseed data without affecting the database schema.

**Options:**
- `--tables [table1,table2,...]` - Comma-separated list of tables to truncate
- `--all` - Truncate all seedable tables
- `--confirm` - Required to confirm the operation (prevents accidental data loss)

### 3. Reset Database

```bash
# Reset database with confirmation
npm run db:reset -- --confirm

# Reset database and run migrations
npm run db:reset -- --confirm --migrate

# Reset database, run migrations, and seed
npm run db:reset -- --confirm --migrate --seed
```

This command completely drops and recreates the database. Use it when you want to start with a clean slate.

**Options:**
- `--confirm` - Required to confirm the operation (prevents accidental data loss)
- `--migrate` - Run migrations after resetting the database
- `--seed` - Run seeders after migrations (requires `--migrate`)

### 4. Enhanced Seed Command

```bash
# Run seeders normally (only seeds empty tables)
npm run seed

# Force seed data even if tables aren't empty
npm run seed -- --force
```

The existing seed command has been enhanced with a `--force` option that allows seeding data even when tables already contain data.

## Common Workflows

### Complete Reset and Setup

When you need to completely reset the database with fresh schema and seed data:

```bash
npm run db:reset -- --confirm --migrate --seed
```

### Verify and Fix Missing Seed Data

When seed data is missing but the database schema is correct:

```bash
# First verify what data exists
npm run db:verify

# Then force seed the data
npm run seed -- --force
```

### Reset Only Specific Tables

When you need to reset only specific tables (e.g., users) without affecting others:

```bash
npm run db:truncate -- --tables users,tenant_memberships --confirm
npm run seed
```

## Troubleshooting

### Missing Environment Variables

If you encounter connection errors, verify your environment variables:

```bash
npm run db:verify
```

This will tell you which specific variables are missing or incorrect.

### Tables Don't Exist

If tables don't exist after migrations should have created them:

1. Verify that migrations have been applied: `npm run migration:show`
2. Check the `DB_SYNCHRONIZE` setting in `.env` (should be `false` for migrations)
3. Check if `DB_MIGRATIONS_RUN` needs to be set to `true`

### Seed Data Not Appearing

If seed data isn't appearing after running seeders:

1. Check if tables already contain data: `npm run db:verify`
2. Use force option to override: `npm run seed -- --force`
3. If needed, truncate tables first: `npm run db:truncate -- --tables users --confirm`

## Environment Variables Checklist

The following environment variables are essential for database operations:

```
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=authcakes_user
DB_PASSWORD=local-password
DB_NAME=authcakes_dev
DB_SYNCHRONIZE=false
DB_LOGGING=false
DB_SSL=false
DB_MIGRATIONS_RUN=false
```

Make sure they are correctly set in your `.env` file before running database operations.
