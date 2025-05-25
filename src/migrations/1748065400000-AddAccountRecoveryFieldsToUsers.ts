import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccountRecoveryFieldsToUsers1748065400000 implements MigrationInterface {
    name = 'AddAccountRecoveryFieldsToUsers1748065400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "accountRecoveryToken" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "accountRecoveryTokenExpiry" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "accountRecoveryTokenExpiry"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "accountRecoveryToken"`);
    }
}