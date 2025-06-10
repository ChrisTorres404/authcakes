import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiKeyResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'API key unique identifier' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'User ID who owns this API key' })
  userId: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'Tenant ID associated with this API key',
  })
  tenantId?: string;

  @ApiProperty({ example: 'Production API Key', description: 'Name of the API key' })
  name: string;

  @ApiProperty({ example: 'ak_live_1234567890abcdef', description: 'The API key value (only shown on creation)' })
  key?: string;

  @ApiProperty({ example: { read: true, write: false, delete: false }, description: 'API key permissions object' })
  permissions: Record<string, unknown>;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z', type: 'string', format: 'date-time', description: 'API key expiration date' })
  expiresAt?: Date;

  @ApiProperty({ example: true, description: 'Whether the API key is active' })
  active: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', type: 'string', format: 'date-time', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', type: 'string', format: 'date-time', description: 'Last update timestamp' })
  updatedAt: Date;
}

export class ApiKeyListResponseDto {
  @ApiProperty({ type: [ApiKeyResponseDto] })
  apiKeys: ApiKeyResponseDto[];
}
