//src/common/interceptors/tenant-context.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Extract tenant ID from various possible sources using optional chaining
    const tenantId =
      request.params?.tenantId ||
      request.body?.tenantId ||
      request.headers?.['x-tenant-id'] ||
      request.user?.tenantId ||
      null;

    // Always set tenantId, even if null
    request.tenantId = tenantId;
    if (!tenantId) {
      if (!request.user) {
        console.warn('[TenantContextInterceptor] Warning: request.user is missing when trying to access tenantId');
      }
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[TenantContextInterceptor] Warning: tenantId is missing in request context');
      }
    }

    return next.handle();
  }
}