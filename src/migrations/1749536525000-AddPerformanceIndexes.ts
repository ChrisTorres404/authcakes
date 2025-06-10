import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1749536525000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1749536525000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table indexes for authentication lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email 
      ON users(email)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_active 
      ON users(active)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role 
      ON users(role)
    `);

    // Sessions table composite indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id 
      ON sessions("userId")
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at 
      ON sessions("expiresAt")
    `);

    // Refresh tokens table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id 
      ON refresh_tokens("userId")
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token 
      ON refresh_tokens(token)
    `);

    // Tenant memberships table indexes (critical for performance)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user_id 
      ON tenant_memberships(user_id)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant_id 
      ON tenant_memberships(tenant_id)
    `);
    
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_memberships_user_tenant 
      ON tenant_memberships(user_id, tenant_id) 
      WHERE "deletedAt" IS NULL
    `);

    // Logs table indexes for audit trails
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_user_id 
      ON logs("userId") 
      WHERE "userId" IS NOT NULL
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_action 
      ON logs(action)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp 
      ON logs(timestamp)
    `);

    // API keys table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_api_keys_user_id 
      ON api_keys("userId")
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_api_keys_key 
      ON api_keys(key)
    `);

    // System settings indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_system_settings_key 
      ON system_settings(key)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes in reverse order
    await queryRunner.query(`DROP INDEX IF EXISTS idx_system_settings_key`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_api_keys_key`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_api_keys_user_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_logs_timestamp`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_logs_action`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_logs_user_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tenant_memberships_user_tenant`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tenant_memberships_tenant_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tenant_memberships_user_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_token`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_user_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sessions_expires_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sessions_user_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_role`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_email`);
  }
}