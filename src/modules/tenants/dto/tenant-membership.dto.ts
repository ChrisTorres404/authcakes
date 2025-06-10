import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantRole } from './tenant-invitation.dto';

export class TenantMembershipDto {
  @ApiProperty({ example: 'uuid-of-membership' })
  id: string;

  @ApiProperty({ example: 'uuid-of-user' })
  userId: string;

  @ApiProperty({ example: 'uuid-of-tenant' })
  tenantId: string;

  @ApiProperty({ example: TenantRole.MEMBER, enum: TenantRole })
  role: TenantRole;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', type: 'string', format: 'date-time' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', type: 'string', format: 'date-time' })
  updatedAt: string;

  @ApiPropertyOptional({ example: null, type: 'string', format: 'date-time', nullable: true })
  deletedAt?: string;
}
