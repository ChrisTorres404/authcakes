"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAccountRecoveryFieldsToUsers1748065400000 = void 0;
class AddAccountRecoveryFieldsToUsers1748065400000 {
    name = 'AddAccountRecoveryFieldsToUsers1748065400000';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ADD "accountRecoveryToken" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "accountRecoveryTokenExpiry" TIMESTAMP`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "accountRecoveryTokenExpiry"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "accountRecoveryToken"`);
    }
}
exports.AddAccountRecoveryFieldsToUsers1748065400000 = AddAccountRecoveryFieldsToUsers1748065400000;
//# sourceMappingURL=1748065400000-AddAccountRecoveryFieldsToUsers.js.map