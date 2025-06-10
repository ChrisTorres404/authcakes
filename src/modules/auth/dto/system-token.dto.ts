import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SystemTokenDto {
  @ApiProperty({
    example: 'sk_live_gmt9MsfGM5h830F8JFVQ5NCmgQnBj6ECGhzbDCBZG8aW5dOCYu7vC591IVZ8j',
    description: 'System API key',
  })
  @IsString()
  apiKey: string;

  @ApiProperty({
    example: 'mobile-app-v1',
    description: 'Client identifier',
  })
  @IsString()
  clientId: string;

  @ApiPropertyOptional({
    example: ['read', 'write'],
    description: 'Requested permissions',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}