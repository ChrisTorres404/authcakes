import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantInvitationsTable1685601100000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenant_invitations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "invitedBy" uuid NOT NULL,
        "email" varchar NOT NULL,
        "role" varchar NOT NULL DEFAULT 'member',
        "token" varchar NOT NULL UNIQUE,
        "expiresAt" TIMESTAMP NOT NULL,
        "acceptedAt" TIMESTAMP,
        "acceptedBy" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_org_invite_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_org_invite_invitedBy" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_org_invite_acceptedBy" FOREIGN KEY ("acceptedBy") REFERENCES "users"("id") ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_tenant_invite_tenantId" ON "tenant_invitations" ("tenantId");
      CREATE INDEX IF NOT EXISTS "IDX_tenant_invite_email" ON "tenant_invitations" ("email");
      CREATE INDEX IF NOT EXISTS "IDX_tenant_invite_token" ON "tenant_invitations" ("token");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "tenant_invitations"');
  }
}
