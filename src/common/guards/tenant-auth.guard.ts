//src/common/guards/tenant-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { TenantsService } from '../../modules/tenants/services/tenants.service';
import { REQUIRED_TENANT_ROLES_KEY } from '../decorators/tenant-roles.decorator';
import { User } from '../../modules/users/entities/user.entity';

interface RequestWithUser extends Omit<Request, 'user'> {
  user: User & {
    tenantAccess: string[];
    tenantId?: string;
  };
  params: {
    tenantId?: string;
  };
  body: {
    tenantId?: string;
  };
  tenantId?: string;
}

interface AuditEvent {
  userId: string | undefined;
  tenantId: string | undefined;
  action: 'access_granted' | 'access_denied';
  reason: string;
}

@Injectable()
export class TenantAuthGuard implements CanActivate {
  private readonly logger = new Logger(TenantAuthGuard.name);
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantsService: TenantsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the required tenant roles from the decorator
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_TENANT_ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    // If no roles required, allow access
    if (!requiredRoles.length) {
      this.logger.debug('[TenantAuthGuard] No requiredRoles, access allowed');
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // Handle potential array value from headers
    const headerTenantId = request.headers['x-tenant-id'];
    const tenantIdFromHeader = Array.isArray(headerTenantId)
      ? headerTenantId[0]
      : headerTenantId;

    let tenantId: string | undefined =
      request.params.tenantId ||
      request.body.tenantId ||
      tenantIdFromHeader ||
      request.tenantId;
    // Best practice: fallback to user.tenantId from JWT if not present in request
    if (!tenantId && user && user.tenantId) {
      tenantId = user.tenantId;
      this.logger.debug(
        '[TenantAuthGuard] Fallback: using tenantId from user.tenantId in JWT:',
        tenantId,
      );
    }

    this.logger.debug(`[TenantAuthGuard] Checking access for user:`, user);
    this.logger.debug(`[TenantAuthGuard] tenantId:`, tenantId);
    this.logger.debug(
      `[TenantAuthGuard] user.tenantAccess:`,
      user?.tenantAccess,
    );
    this.logger.debug(`[TenantAuthGuard] requiredRoles:`, requiredRoles);

    // If no tenantId found, deny access
    if (!tenantId) {
      this.logger.warn(
        `[TenantAuthGuard] Access denied: Missing tenant context for user ${user?.id}`,
      );
      this.logAuditEvent();
      throw new ForbiddenException('Tenant context is required');
    }

    // Enterprise-level: Check for missing user or tenantAccess
    if (!user || !Array.isArray(user.tenantAccess)) {
      this.logger.warn(
        `[TenantAuthGuard] Access denied: Missing user or tenantAccess. user:`,
        user,
        'tenantAccess:',
        user?.tenantAccess,
      );
      this.logAuditEvent();
      throw new ForbiddenException('User context is required');
    }

    // Check if user has access to this tenant
    if (!user.tenantAccess.includes(tenantId)) {
      this.logger.warn(
        `[TenantAuthGuard] Access denied: User ${user?.id} does not have access to tenant ${tenantId}`,
      );
      this.logAuditEvent();
      throw new ForbiddenException('User does not have access to this tenant');
    }

    // If no specific roles required beyond access, allow
    if (requiredRoles.length === 0) {
      this.logger.log(
        `[TenantAuthGuard] Access granted: User ${user?.id} has access to tenant ${tenantId} (no specific role required)`,
      );
      this.logAuditEvent();
      return true;
    }

    // Get user's role for this tenant
    const membership = await this.tenantsService.getUserTenantMembership(
      user.id,
      tenantId,
    );
    this.logger.debug(`[TenantAuthGuard] membership:`, membership);

    if (!membership) {
      this.logger.warn(
        `[TenantAuthGuard] Access denied: User ${user?.id} is not a member of tenant ${tenantId}`,
      );
      this.logAuditEvent();
      throw new ForbiddenException('User is not a member of this tenant');
    }

    // Check if user's tenant role satisfies requirements
    if (!requiredRoles.includes(membership.role)) {
      this.logger.warn(
        `[TenantAuthGuard] Access denied: User ${user?.id} has role ${membership.role} but requires one of [${requiredRoles.join(', ')}] in tenant ${tenantId}`,
      );
      this.logAuditEvent();
      throw new ForbiddenException(
        'User does not have the required role for this tenant',
      );
    }
    this.logger.log(
      `[TenantAuthGuard] Access granted: User ${user?.id} with role ${membership.role} in tenant ${tenantId}`,
    );
    this.logAuditEvent();
    return true;
  }

  // Placeholder for sending structured audit events to an external service
  protected logAuditEvent(): void {
    // Integrate with your audit/event service here (e.g., send to a message queue, external API, etc.)
    // Example: auditService.log(event);
  }
}
