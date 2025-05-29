import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWebauthnCredentialsTable1685600700000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "webauthn_credentials" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "credentialId" varchar NOT NULL,
        "publicKey" text NOT NULL,
        "counter" integer NOT NULL DEFAULT 0,
        "deviceName" varchar,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_webauthn_user_credential" UNIQUE ("userId", "credentialId"),
        CONSTRAINT "FK_webauthn_credentials_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "IDX_webauthn_credentials_userId" ON "webauthn_credentials" ("userId");
      CREATE INDEX IF NOT EXISTS "IDX_webauthn_credentials_credentialId" ON "webauthn_credentials" ("credentialId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "webauthn_credentials"');
  }
}
