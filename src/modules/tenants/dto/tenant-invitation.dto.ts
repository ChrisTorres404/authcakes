import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TenantRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export class TenantInvitationDto {
  @ApiProperty({ example: 'uuid-of-invitation' })
  id: string;

  @ApiProperty({ example: 'uuid-of-tenant' })
  tenantId: string;

  @ApiProperty({ example: 'uuid-of-user' })
  invitedBy: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: TenantRole.MEMBER, enum: TenantRole })
  role: TenantRole;

  @ApiProperty({ example: 'token-string' })
  token: string;

  @ApiProperty({ type: 'string', format: 'date-time' })
  expiresAt: string;

  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true })
  acceptedAt?: string;

  @ApiPropertyOptional({ example: 'uuid-of-user', nullable: true })
  acceptedBy?: string;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt: string;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt: string;
}
