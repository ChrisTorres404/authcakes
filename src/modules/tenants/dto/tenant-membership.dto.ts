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

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt: string;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt: string;

  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true })
  deletedAt?: string;
}
