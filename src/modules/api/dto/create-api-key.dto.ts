import { IsString, IsOptional, IsObject, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Production API Key', description: 'Name of the API key' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ 
    example: { read: true, write: false, delete: false },
    description: 'API key permissions object' 
  })
  @IsObject()
  @IsOptional()
  permissions?: Record<string, unknown>;

  @ApiPropertyOptional({ 
    example: '2024-12-31T23:59:59Z',
    description: 'API key expiration date' 
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
