"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlterRefreshTokensColumnsToText1685601700000 = void 0;
class AlterRefreshTokensColumnsToText1685601700000 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
        ALTER COLUMN "token" TYPE text,
        ALTER COLUMN "replacedByToken" TYPE text;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
        ALTER COLUMN "token" TYPE varchar(128),
        ALTER COLUMN "replacedByToken" TYPE varchar(128);
    `);
    }
}
exports.AlterRefreshTokensColumnsToText1685601700000 = AlterRefreshTokensColumnsToText1685601700000;
//# sourceMappingURL=1685601700000-AlterRefreshTokensColumnsToText.js.map