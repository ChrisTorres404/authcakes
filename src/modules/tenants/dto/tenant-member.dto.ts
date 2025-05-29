import { ApiProperty } from '@nestjs/swagger';
import { TenantRole } from './tenant-invitation.dto';

export class InviteTenantMemberDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ enum: TenantRole, example: TenantRole.MEMBER })
  role: TenantRole;

  @ApiProperty({ example: 'uuid-of-inviting-user' })
  invitedBy: string;
}

export class UpdateTenantMemberRoleDto {
  @ApiProperty({ enum: TenantRole, example: TenantRole.ADMIN })
  role: TenantRole;
}
