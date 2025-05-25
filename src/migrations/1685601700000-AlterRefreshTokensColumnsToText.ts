import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterRefreshTokensColumnsToText1685601700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
        ALTER COLUMN "token" TYPE text,
        ALTER COLUMN "replacedByToken" TYPE text;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
        ALTER COLUMN "token" TYPE varchar(128),
        ALTER COLUMN "replacedByToken" TYPE varchar(128);
    `);
  }
} 