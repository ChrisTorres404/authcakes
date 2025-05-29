// src/migrations/1685500000000-EnablePgcryptoExtension.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnablePgcryptoExtension1685500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
      console.log('pgcrypto extension enabled successfully');
    } catch (error) {
      console.error(
        'Failed to enable pgcrypto extension. You may need to enable it manually as a database superuser.',
      );
      console.error('Error details:', error.message);
      // The migration continues even if this fails
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // We don't typically remove extensions in down migrations
  }
}
