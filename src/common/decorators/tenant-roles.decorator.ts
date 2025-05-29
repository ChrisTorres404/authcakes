//src/common/decorators/tenant-roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const REQUIRED_TENANT_ROLES_KEY = 'requiredTenantRoles';
export const TenantRoles = (...roles: string[]) =>
  SetMetadata(REQUIRED_TENANT_ROLES_KEY, roles);
