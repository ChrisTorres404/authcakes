import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingOtpColumnsToUsers1748322700000 implements MigrationInterface {
    name = 'AddMissingOtpColumnsToUsers1748322700000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add missing OTP columns to users table
        await queryRunner.query(`ALTER TABLE "users" ADD "otp" varchar(10) NULL DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "otpExpiry" timestamp NULL DEFAULT NULL`);
        
        // Also add the accountRecovery columns if they're missing too
        await queryRunner.query(`ALTER TABLE "users" ADD IF NOT EXISTS "accountRecoveryToken" varchar(255) NULL DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD IF NOT EXISTS "accountRecoveryTokenExpiry" timestamp NULL DEFAULT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "accountRecoveryTokenExpiry"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "accountRecoveryToken"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "otpExpiry"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "otp"`);
    }
}