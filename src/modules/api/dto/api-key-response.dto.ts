import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiKeyResponseDto {
  @ApiProperty({ description: 'API key unique identifier' })
  id: string;

  @ApiProperty({ description: 'User ID who owns this API key' })
  userId: string;

  @ApiPropertyOptional({
    description: 'Tenant ID associated with this API key',
  })
  tenantId?: string;

  @ApiProperty({ description: 'Name of the API key' })
  name: string;

  @ApiProperty({ description: 'The API key value (only shown on creation)' })
  key?: string;

  @ApiProperty({ description: 'API key permissions object' })
  permissions: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'API key expiration date' })
  expiresAt?: Date;

  @ApiProperty({ description: 'Whether the API key is active' })
  active: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class ApiKeyListResponseDto {
  @ApiProperty({ type: [ApiKeyResponseDto] })
  apiKeys: ApiKeyResponseDto[];
}
