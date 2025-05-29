import { IsString, IsOptional, IsObject, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Name of the API key' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'API key permissions object' })
  @IsObject()
  @IsOptional()
  permissions?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'API key expiration date' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
