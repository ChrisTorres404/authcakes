import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TenantRole } from './add-user-to-tenant.dto';

export class UpdateTenantMembershipDto {
  @ApiProperty({
    enum: TenantRole,
    description: 'Role for the user in the tenant',
  })
  @IsEnum(TenantRole)
  role: TenantRole;
}
