"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLastUsedAtToSessions1685601600000 = void 0;
class AddLastUsedAtToSessions1685601600000 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "sessions"
      DROP COLUMN IF EXISTS "lastUsedAt";
    `);
    }
}
exports.AddLastUsedAtToSessions1685601600000 = AddLastUsedAtToSessions1685601600000;
//# sourceMappingURL=1685601600000-AddLastUsedAtToSessions.js.map