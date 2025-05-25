import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLogsTable1685600900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid,
        "tenantId" uuid,
        "action" varchar NOT NULL,
        "ip" varchar,
        "userAgent" varchar,
        "details" jsonb,
        "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_logs_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_logs_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_logs_userId" ON "logs" ("userId");
      CREATE INDEX IF NOT EXISTS "IDX_logs_tenantId" ON "logs" ("tenantId");
      CREATE INDEX IF NOT EXISTS "IDX_logs_action" ON "logs" ("action");
      CREATE INDEX IF NOT EXISTS "IDX_logs_timestamp" ON "logs" ("timestamp");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "logs"');
  }
} 