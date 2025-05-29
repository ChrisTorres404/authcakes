"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddProfileUpdateSettings1748325900000 = void 0;
class AddProfileUpdateSettings1748325900000 {
    async up(queryRunner) {
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
    async down(queryRunner) {
        await queryRunner.query(`
      DELETE FROM system_settings
      WHERE key IN ('ALLOW_USER_PROFILE_UPDATE', 'PROFILE_UPDATABLE_FIELDS')
    `);
    }
}
exports.AddProfileUpdateSettings1748325900000 = AddProfileUpdateSettings1748325900000;
//# sourceMappingURL=1748325900000-AddProfileUpdateSettings.js.map