//src/common/interceptors/tenant-context.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { User } from '../../modules/users/entities/user.entity';

interface TenantHeaders extends Record<string, string | string[] | undefined> {
  'x-tenant-id'?: string | string[];
}

interface RequestWithTenant extends Omit<Request, 'headers'> {
  tenantId?: string | null;
  user?: User & {
    tenantId?: string;
  };
  params: {
    tenantId?: string;
  };
  body: {
    tenantId?: string;
  };
  headers: TenantHeaders;
}

interface TenantError extends Error {
  stack?: string;
  status?: number;
}

function isTenantError(error: unknown): error is TenantError {
  return error instanceof Error;
}

@Injectable()
export class TenantContextInterceptor
  implements NestInterceptor<unknown, unknown>
{
  private readonly logger = new Logger(TenantContextInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();

    // Extract tenant ID from various possible sources using optional chaining
    const headerTenantId = request.headers['x-tenant-id'];
    const tenantId: string | null =
      request.params?.tenantId ||
      request.body?.tenantId ||
      (Array.isArray(headerTenantId) ? headerTenantId[0] : headerTenantId) ||
      request.user?.tenantId ||
      null;

    // Always set tenantId, even if null
    request.tenantId = tenantId;

    // Log warnings if tenant context is missing
    if (!tenantId) {
      if (!request.user) {
        this.logger.warn(
          'Warning: request.user is missing when trying to access tenantId',
          { path: request.path },
        );
      }
      if (process.env.NODE_ENV !== 'test') {
        this.logger.warn('Warning: tenantId is missing in request context', {
          path: request.path,
          method: request.method,
        });
      }
    }

    return next.handle().pipe(
      tap({
        error: (error: unknown) => {
          if (isTenantError(error)) {
            this.logger.error(
              `Error processing request with tenant context: ${error.message}`,
              {
                tenantId,
                path: request.path,
                status: error.status,
                stack: error.stack,
              },
            );
          } else {
            this.logger.error(
              'Unknown error processing request with tenant context',
              {
                tenantId,
                path: request.path,
                error: String(error),
              },
            );
          }
        },
      }),
    );
  }
}
