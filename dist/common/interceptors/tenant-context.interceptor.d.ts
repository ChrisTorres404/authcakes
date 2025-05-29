import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class TenantContextInterceptor implements NestInterceptor<unknown, unknown> {
    private readonly logger;
    intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown>;
}
