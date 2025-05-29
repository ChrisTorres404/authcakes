import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for profile update settings
 */
export class ProfileSettingsDto {
  @ApiProperty({
    description:
      'Controls whether users can update their own profile information',
    example: true,
    default: true,
  })
  allowUserProfileUpdate: boolean;

  @ApiProperty({
    description: 'List of fields users are allowed to update in their profiles',
    example: ['firstName', 'lastName', 'avatar', 'bio'],
    isArray: true,
  })
  profileUpdatableFields: string[];
}
