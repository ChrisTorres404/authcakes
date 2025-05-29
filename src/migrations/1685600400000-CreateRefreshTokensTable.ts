import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokensTable1685600400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "sessionId" uuid REFERENCES "sessions"("id") ON DELETE SET NULL,
        "token" varchar(128) NOT NULL UNIQUE,
        "expiresAt" TIMESTAMP NOT NULL,
        "isRevoked" boolean NOT NULL DEFAULT false,
        "revokedAt" TIMESTAMP,
        "revokedBy" varchar(128),
        "replacedByToken" varchar(128),
        "revocationReason" varchar(256),
        "userAgent" varchar(256),
        "ipAddress" varchar(64),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_refresh_tokens_expires" CHECK ("expiresAt" > "createdAt"),
        CONSTRAINT "CHK_refresh_tokens_revoked" CHECK (("isRevoked" = false) OR ("isRevoked" = true AND "revokedAt" IS NOT NULL))
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_refresh_tokens_token" ON "refresh_tokens" ("token");
      CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_userId" ON "refresh_tokens" ("userId");
      CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_sessionId" ON "refresh_tokens" ("sessionId");
      CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_expiresAt" ON "refresh_tokens" ("expiresAt");
      CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_isRevoked" ON "refresh_tokens" ("isRevoked");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "refresh_tokens"');
  }
}
