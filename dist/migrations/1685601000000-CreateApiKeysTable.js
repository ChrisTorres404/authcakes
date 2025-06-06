"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateApiKeysTable1685601000000 = void 0;
class CreateApiKeysTable1685601000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "api_keys" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "tenantId" uuid,
        "name" varchar NOT NULL,
        "key" varchar NOT NULL UNIQUE,
        "permissions" jsonb NOT NULL DEFAULT '{}',
        "expiresAt" TIMESTAMP,
        "active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_api_keys_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_api_keys_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_api_keys_userId" ON "api_keys" ("userId");
      CREATE INDEX IF NOT EXISTS "IDX_api_keys_tenantId" ON "api_keys" ("tenantId");
      CREATE INDEX IF NOT EXISTS "IDX_api_keys_key" ON "api_keys" ("key");
    `);
    }
    async down(queryRunner) {
        await queryRunner.query('DROP TABLE IF EXISTS "api_keys"');
    }
}
exports.CreateApiKeysTable1685601000000 = CreateApiKeysTable1685601000000;
//# sourceMappingURL=1685601000000-CreateApiKeysTable.js.map