"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSystemSettingsTable1685600500000 = void 0;
class CreateSystemSettingsTable1685600500000 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "system_settings" (
        "key" varchar PRIMARY KEY,
        "value" text NOT NULL,
        "type" varchar NOT NULL DEFAULT 'string',
        "description" varchar,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_system_settings_type" ON "system_settings" ("type");
    `);
    }
    async down(queryRunner) {
        await queryRunner.query('DROP TABLE IF EXISTS "system_settings"');
    }
}
exports.CreateSystemSettingsTable1685600500000 = CreateSystemSettingsTable1685600500000;
//# sourceMappingURL=1685600500000-CreateSystemSettingsTable.js.map