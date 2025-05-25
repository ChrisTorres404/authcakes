"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMfaRecoveryCodesTable1685600600000 = void 0;
class CreateMfaRecoveryCodesTable1685600600000 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mfa_recovery_codes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "code" varchar NOT NULL,
        "used" boolean NOT NULL DEFAULT false,
        "usedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_mfa_recovery_codes_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "IDX_mfa_recovery_codes_userId" ON "mfa_recovery_codes" ("userId");
      CREATE INDEX IF NOT EXISTS "IDX_mfa_recovery_codes_code" ON "mfa_recovery_codes" ("code");
    `);
    }
    async down(queryRunner) {
        await queryRunner.query('DROP TABLE IF EXISTS "mfa_recovery_codes"');
    }
}
exports.CreateMfaRecoveryCodesTable1685600600000 = CreateMfaRecoveryCodesTable1685600600000;
//# sourceMappingURL=1685600600000-CreateMfaRecoveryCodesTable.js.map