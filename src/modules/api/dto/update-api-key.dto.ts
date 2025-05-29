import {
  IsString,
  IsOptional,
  IsObject,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateApiKeyDto {
  @ApiPropertyOptional({ description: 'Name of the API key' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'API key permissions object' })
  @IsObject()
  @IsOptional()
  permissions?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'API key expiration date' })
  @IsDateString()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'API key active status' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
