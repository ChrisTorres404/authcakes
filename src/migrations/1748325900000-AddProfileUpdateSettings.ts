import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileUpdateSettings1748325900000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Default updatable fields include all safe profile fields
    const defaultUpdatableFields = JSON.stringify([
      'firstName',
      'lastName',
      'avatar',
      'company',
      'department',
      'country',
      'state',
      'address',
      'address2',
      'city',
      'zipCode',
      'bio',
    ]);

    // Add setting to control if users can update their own profiles (default: true)
    await queryRunner.query(`
      INSERT INTO system_settings (key, value, type, description)
      VALUES (
        'ALLOW_USER_PROFILE_UPDATE',
        'true',
        'boolean',
        'Controls whether users can update their own profile information'
      )
      ON CONFLICT (key) DO UPDATE
      SET value = 'true',
          type = 'boolean',
          description = 'Controls whether users can update their own profile information'
    `);

    // Add setting to specify which fields users are allowed to update
    await queryRunner.query(`
      INSERT INTO system_settings (key, value, type, description)
      VALUES (
        'PROFILE_UPDATABLE_FIELDS',
        '${defaultUpdatableFields}',
        'json',
        'List of fields users are allowed to update in their profiles'
      )
      ON CONFLICT (key) DO UPDATE
      SET value = '${defaultUpdatableFields}',
          type = 'json',
          description = 'List of fields users are allowed to update in their profiles'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the settings
    await queryRunner.query(`
      DELETE FROM system_settings
      WHERE key IN ('ALLOW_USER_PROFILE_UPDATE', 'PROFILE_UPDATABLE_FIELDS')
    `);
  }
}
