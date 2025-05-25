"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTenantMembershipsTable1685600200000 = void 0;
class CreateTenantMembershipsTable1685600200000 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenant_memberships" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "role" varchar NOT NULL DEFAULT 'member',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "FK_tenant_memberships_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tenant_memberships_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "IDX_tenant_memberships_user_id" ON "tenant_memberships" ("user_id");
      CREATE INDEX IF NOT EXISTS "IDX_tenant_memberships_tenant_id" ON "tenant_memberships" ("tenant_id");
    `);
    }
    async down(queryRunner) {
        await queryRunner.query('DROP TABLE IF EXISTS "tenant_memberships"');
    }
}
exports.CreateTenantMembershipsTable1685600200000 = CreateTenantMembershipsTable1685600200000;
//# sourceMappingURL=1685600200000-CreateTenantMembershipsTable.js.map