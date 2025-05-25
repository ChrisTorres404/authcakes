import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSystemSettingsTable1685600500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "system_settings" (
        "key" varchar PRIMARY KEY,
        "value" text NOT NULL,
        "type" varchar NOT NULL DEFAULT 'string',
        "description" varchar,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_system_settings_type" ON "system_settings" ("type");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "system_settings"');
  }
} 