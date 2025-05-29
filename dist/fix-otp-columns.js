"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const typeorm_1 = require("typeorm");
async function bootstrap() {
    common_1.Logger.log('Starting script to add missing OTP columns to users table...');
    try {
        const appContext = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
        const dataSource = appContext.get(typeorm_1.DataSource);
        common_1.Logger.log('Database connection established');
        const queryRunner = dataSource.createQueryRunner();
        const tables = await queryRunner.getTables();
        const usersTable = tables.find((t) => t.name === 'users');
        if (!usersTable) {
            common_1.Logger.error('Users table not found!');
            process.exit(1);
        }
        const hasOtpColumn = usersTable.columns.some((c) => c.name === 'otp');
        const hasOtpExpiryColumn = usersTable.columns.some((c) => c.name === 'otpExpiry');
        const hasAccountRecoveryTokenColumn = usersTable.columns.some((c) => c.name === 'accountRecoveryToken');
        const hasAccountRecoveryTokenExpiryColumn = usersTable.columns.some((c) => c.name === 'accountRecoveryTokenExpiry');
        try {
            await queryRunner.startTransaction();
            if (!hasOtpColumn) {
                common_1.Logger.log('Adding otp column to users table...');
                await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otp" varchar(10) NULL DEFAULT NULL`);
                common_1.Logger.log('Successfully added otp column');
            }
            else {
                common_1.Logger.log('otp column already exists');
            }
            if (!hasOtpExpiryColumn) {
                common_1.Logger.log('Adding otpExpiry column to users table...');
                await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otpExpiry" timestamp NULL DEFAULT NULL`);
                common_1.Logger.log('Successfully added otpExpiry column');
            }
            else {
                common_1.Logger.log('otpExpiry column already exists');
            }
            if (!hasAccountRecoveryTokenColumn) {
                common_1.Logger.log('Adding accountRecoveryToken column to users table...');
                await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountRecoveryToken" varchar(255) NULL DEFAULT NULL`);
                common_1.Logger.log('Successfully added accountRecoveryToken column');
            }
            else {
                common_1.Logger.log('accountRecoveryToken column already exists');
            }
            if (!hasAccountRecoveryTokenExpiryColumn) {
                common_1.Logger.log('Adding accountRecoveryTokenExpiry column to users table...');
                await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountRecoveryTokenExpiry" timestamp NULL DEFAULT NULL`);
                common_1.Logger.log('Successfully added accountRecoveryTokenExpiry column');
            }
            else {
                common_1.Logger.log('accountRecoveryTokenExpiry column already exists');
            }
            await queryRunner.commitTransaction();
            common_1.Logger.log('All missing columns have been added successfully');
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            common_1.Logger.error(`Error adding columns: ${error.message}`, error.stack);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        await appContext.close();
        process.exit(0);
    }
    catch (error) {
        common_1.Logger.error(`Error: ${error.message}`, error.stack);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=fix-otp-columns.js.map