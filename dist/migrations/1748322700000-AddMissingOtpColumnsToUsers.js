"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMissingOtpColumnsToUsers1748322700000 = void 0;
class AddMissingOtpColumnsToUsers1748322700000 {
    name = 'AddMissingOtpColumnsToUsers1748322700000';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otp" varchar(10) NULL DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otpExpiry" timestamp NULL DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountRecoveryToken" varchar(255) NULL DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountRecoveryTokenExpiry" timestamp NULL DEFAULT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "accountRecoveryTokenExpiry"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "accountRecoveryToken"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "otpExpiry"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "otp"`);
    }
}
exports.AddMissingOtpColumnsToUsers1748322700000 = AddMissingOtpColumnsToUsers1748322700000;
//# sourceMappingURL=1748322700000-AddMissingOtpColumnsToUsers.js.map