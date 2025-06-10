import { IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TenantRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export class AddUserToTenantDto {
  @ApiProperty({
    example: 'uuid-of-user',
    description: 'User ID to add to tenant',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    enum: TenantRole,
    example: TenantRole.MEMBER,
    description: 'Role for the user in the tenant',
  })
  @IsEnum(TenantRole)
  role: TenantRole;
}
