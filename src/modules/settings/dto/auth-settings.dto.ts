import { ApiProperty } from '@nestjs/swagger';

export class AuthSettingsDto {
  @ApiProperty({ example: true, description: 'Enable email authentication.' })
  enableEmailAuth: boolean;

  @ApiProperty({ example: true, description: 'Enable SMS authentication.' })
  enableSmsAuth: boolean;

  @ApiProperty({ example: false, description: 'Enable Google authentication.' })
  enableGoogleAuth: boolean;

  @ApiProperty({ example: false, description: 'Enable Apple authentication.' })
  enableAppleAuth: boolean;

  @ApiProperty({ example: true, description: 'Enable multi-factor authentication (MFA).' })
  enableMfa: boolean;

  @ApiProperty({ example: true, description: 'Enable WebAuthn authentication.' })
  enableWebauthn: boolean;

  @ApiProperty({ example: 8, description: 'Minimum password length.' })
  passwordMinLength: number;

  @ApiProperty({ example: true, description: 'Require uppercase letter in password.' })
  passwordRequireUppercase: boolean;

  @ApiProperty({ example: true, description: 'Require lowercase letter in password.' })
  passwordRequireLowercase: boolean;

  @ApiProperty({ example: true, description: 'Require number in password.' })
  passwordRequireNumber: boolean;

  @ApiProperty({ example: true, description: 'Require special character in password.' })
  passwordRequireSpecial: boolean;

  @ApiProperty({ example: 5, description: 'Maximum login attempts before lockout.' })
  maxLoginAttempts: number;

  @ApiProperty({ example: 30, description: 'Login lockout duration in minutes.' })
  loginLockoutDuration: number;
} 