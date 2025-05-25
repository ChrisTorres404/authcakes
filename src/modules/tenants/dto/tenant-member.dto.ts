import { ApiProperty } from '@nestjs/swagger';

export class InviteTenantMemberDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ enum: ['user', 'admin'], example: 'user' })
  role: 'user' | 'admin';
}

export class UpdateTenantMemberRoleDto {
  @ApiProperty({ enum: ['user', 'admin'], example: 'admin' })
  role: 'user' | 'admin';
} 