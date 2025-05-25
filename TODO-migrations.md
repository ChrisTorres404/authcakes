# TODO: Run TypeORM Core Tables Migration

**Goal:** Apply the new migration to set up users, tenants, tenant_memberships, sessions, and refresh_tokens tables with all relationships and constraints.

---

## Steps

1. **Ensure Database Connection is Configured**
   - Check your `ormconfig.json` or TypeORM config for correct DB credentials and connection settings.
   - Make sure the target database exists and is accessible.

2. **Review the Migration File**
   - Migration file: `src/migrations/1747757168-InitCoreTables.ts`
   - This migration will create all core tables and relationships if they do not already exist.

3. **Run the Migration**
   - From the `authcakes-api-nest` directory, run:
     ```sh
     npm run typeorm:migration:run
     ```
   - Or, if you use a custom script or CLI:
     ```sh
     npx typeorm migration:run
     ```
   - This will apply all pending migrations, including the new core tables migration.

4. **Verify the Database**
   - Check your database (e.g., with a DB client or `psql`) to ensure all tables were created:
     - `users`
     - `tenants`
     - `tenant_memberships`
     - `sessions`
     - `refresh_tokens`

5. **Rolling Back (if needed)**
   - To undo the migration, run:
     ```sh
     npm run typeorm:migration:revert
     ```
   - Or:
     ```sh
     npx typeorm migration:revert
     ```
   - This will roll back the most recent migration (including table drops).

---

**Notes:**
- If you have existing data, back up your database before running destructive migrations.
- If you encounter errors, check the migration file and your DB logs for details.
- You can add more migrations for future schema changes as needed.

---

**Circle back to this after you are ready to run migrations!** 