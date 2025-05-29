import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantResponseDto {
  @ApiProperty({ example: 'uuid-of-tenant' })
  id: string;

  @ApiProperty({ example: 'Acme Corp' })
  name: string;

  @ApiPropertyOptional({ example: 'acme-corp' })
  slug?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  logo?: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiPropertyOptional({
    type: 'object',
    example: { timezone: 'UTC' },
    additionalProperties: true,
  })
  settings?: Record<string, any>;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt: string;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt: string;
}
