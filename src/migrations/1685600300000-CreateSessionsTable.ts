import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionsTable1685600300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "ipAddress" varchar(64),
        "userAgent" varchar(256),
        "deviceInfo" jsonb,
        "expiresAt" TIMESTAMP NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "revoked" boolean NOT NULL DEFAULT false,
        "revokedAt" TIMESTAMP,
        "revokedBy" varchar(128),
        "lastActivityAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_sessions_expires" CHECK ("expiresAt" > "createdAt"),
        CONSTRAINT "CHK_sessions_revoked" CHECK (("revoked" = false) OR ("revoked" = true AND "revokedAt" IS NOT NULL))
      );
      CREATE INDEX IF NOT EXISTS "IDX_sessions_userId" ON "sessions" ("userId");
      CREATE INDEX IF NOT EXISTS "IDX_sessions_expiresAt" ON "sessions" ("expiresAt");
      CREATE INDEX IF NOT EXISTS "IDX_sessions_isActive" ON "sessions" ("isActive");
      CREATE INDEX IF NOT EXISTS "IDX_sessions_revoked" ON "sessions" ("revoked");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "sessions"');
  }
}
