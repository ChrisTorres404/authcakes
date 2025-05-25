"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTenantsTable1685600100000 = void 0;
class CreateTenantsTable1685600100000 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenants" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "slug" varchar NOT NULL UNIQUE,
        "logo" varchar,
        "active" boolean NOT NULL DEFAULT true,
        "settings" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_tenants_slug" ON "tenants" ("slug");
    `);
    }
    async down(queryRunner) {
        await queryRunner.query('DROP TABLE IF EXISTS "tenants"');
    }
}
exports.CreateTenantsTable1685600100000 = CreateTenantsTable1685600100000;
//# sourceMappingURL=1685600100000-CreateTenantsTable.js.map