import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsObject()
  deviceInfo?: Record<string, any>;
}
