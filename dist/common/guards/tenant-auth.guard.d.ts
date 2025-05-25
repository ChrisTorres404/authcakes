import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantsService } from '../../modules/tenants/services/tenants.service';
export declare class TenantAuthGuard implements CanActivate {
    private readonly reflector;
    private readonly tenantsService;
    private readonly logger;
    constructor(reflector: Reflector, tenantsService: TenantsService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    protected logAuditEvent(event: {
        userId: string;
        tenantId: string;
        action: string;
        reason: string;
    }): void;
}
