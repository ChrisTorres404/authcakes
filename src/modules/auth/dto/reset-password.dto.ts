// src/modules/auth/dto/reset-password.dto.ts
import { IsString, MinLength, Matches, IsOptional } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password too weak - must contain uppercase, lowercase, number, and special character',
    },
  )
  password: string;

  @IsOptional()
  @IsString()
  otp?: string;
}
