import { IsNotEmpty, IsString, Matches, MinLength, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteAccountRecoveryDto {
  @ApiProperty({
    description: 'The account recovery token',
    example: 'f8a7c6b5d4e3a2b1c0d9e8f7a6b5c4d3',
  })
  @IsNotEmpty({ message: 'Token is required' })
  @IsString({ message: 'Token must be a string' })
  token: string;

  @ApiProperty({
    description: 'The new password',
    example: 'NewSecurePassword123!',
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString({ message: 'New password must be a string' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'New password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
  })
  newPassword: string;

  @ApiProperty({
    description: 'MFA verification code (required if MFA is enabled)',
    example: '123456',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'MFA code must be a string' })
  @Length(6, 6, { message: 'MFA code must be 6 characters long' })
  mfaCode?: string;
}