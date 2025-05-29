import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  Logger.log('Starting script to add missing OTP columns to users table...');

  try {
    // Create a standalone application context
    const appContext = await NestFactory.createApplicationContext(AppModule);

    // Get the DataSource from the app context
    const dataSource = appContext.get(DataSource);

    Logger.log('Database connection established');

    // Check if otp column exists
    const queryRunner = dataSource.createQueryRunner();
    const tables = await queryRunner.getTables();
    const usersTable = tables.find((t) => t.name === 'users');

    if (!usersTable) {
      Logger.error('Users table not found!');
      process.exit(1);
    }

    const hasOtpColumn = usersTable.columns.some((c) => c.name === 'otp');
    const hasOtpExpiryColumn = usersTable.columns.some(
      (c) => c.name === 'otpExpiry',
    );
    const hasAccountRecoveryTokenColumn = usersTable.columns.some(
      (c) => c.name === 'accountRecoveryToken',
    );
    const hasAccountRecoveryTokenExpiryColumn = usersTable.columns.some(
      (c) => c.name === 'accountRecoveryTokenExpiry',
    );

    // Add missing columns if they don't exist
    try {
      await queryRunner.startTransaction();

      if (!hasOtpColumn) {
        Logger.log('Adding otp column to users table...');
        await queryRunner.query(
          `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otp" varchar(10) NULL DEFAULT NULL`,
        );
        Logger.log('Successfully added otp column');
      } else {
        Logger.log('otp column already exists');
      }

      if (!hasOtpExpiryColumn) {
        Logger.log('Adding otpExpiry column to users table...');
        await queryRunner.query(
          `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otpExpiry" timestamp NULL DEFAULT NULL`,
        );
        Logger.log('Successfully added otpExpiry column');
      } else {
        Logger.log('otpExpiry column already exists');
      }

      if (!hasAccountRecoveryTokenColumn) {
        Logger.log('Adding accountRecoveryToken column to users table...');
        await queryRunner.query(
          `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountRecoveryToken" varchar(255) NULL DEFAULT NULL`,
        );
        Logger.log('Successfully added accountRecoveryToken column');
      } else {
        Logger.log('accountRecoveryToken column already exists');
      }

      if (!hasAccountRecoveryTokenExpiryColumn) {
        Logger.log(
          'Adding accountRecoveryTokenExpiry column to users table...',
        );
        await queryRunner.query(
          `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountRecoveryTokenExpiry" timestamp NULL DEFAULT NULL`,
        );
        Logger.log('Successfully added accountRecoveryTokenExpiry column');
      } else {
        Logger.log('accountRecoveryTokenExpiry column already exists');
      }

      await queryRunner.commitTransaction();
      Logger.log('All missing columns have been added successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      Logger.error(`Error adding columns: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Close the app context when done
    await appContext.close();
    process.exit(0);
  } catch (error) {
    Logger.error(`Error: ${error.message}`, error.stack);
    process.exit(1);
  }
}

bootstrap();
