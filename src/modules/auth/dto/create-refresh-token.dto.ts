import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateRefreshTokenDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsString()
  token: string;

  @IsDateString()
  expiresAt: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;
} 