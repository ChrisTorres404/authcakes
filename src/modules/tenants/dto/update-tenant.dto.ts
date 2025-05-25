// src/modules/tenants/dto/update-tenant.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateTenantDto } from './create-tenant.dto';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {}

// src/modules/tenants/dto/add-user-to-tenant.dto.ts
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class AddUserToTenantDto {
  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  role: string;
}