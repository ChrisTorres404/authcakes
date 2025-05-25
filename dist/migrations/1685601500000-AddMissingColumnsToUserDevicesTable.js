"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMissingColumnsToUserDevicesTable1685601500000 = void 0;
class AddMissingColumnsToUserDevicesTable1685601500000 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "user_devices"
        ADD COLUMN IF NOT EXISTS "ip" varchar,
        ADD COLUMN IF NOT EXISTS "userAgent" varchar,
        ADD COLUMN IF NOT EXISTS "browser" varchar,
        ADD COLUMN IF NOT EXISTS "os" varchar,
        ADD COLUMN IF NOT EXISTS "location" varchar,
        ADD COLUMN IF NOT EXISTS "trusted" boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "user_devices"
        DROP COLUMN IF EXISTS "ip",
        DROP COLUMN IF EXISTS "userAgent",
        DROP COLUMN IF EXISTS "browser",
        DROP COLUMN IF EXISTS "os",
        DROP COLUMN IF EXISTS "location",
        DROP COLUMN IF EXISTS "trusted",
        DROP COLUMN IF EXISTS "lastLogin";
    `);
    }
}
exports.AddMissingColumnsToUserDevicesTable1685601500000 = AddMissingColumnsToUserDevicesTable1685601500000;
//# sourceMappingURL=1685601500000-AddMissingColumnsToUserDevicesTable.js.map