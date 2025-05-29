// DTOs for Tenants
// src/modules/tenants/dto/create-tenant.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Corp', description: 'Tenant name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'acme-corp',
    description: 'Unique slug for the tenant',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/logo.png',
    description: 'Logo URL',
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ example: true, description: 'Is tenant active?' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    type: 'object',
    example: { timezone: 'UTC' },
    description: 'Tenant settings',
    additionalProperties: true,
  })
  @IsOptional()
  settings?: Record<string, any>;
}
