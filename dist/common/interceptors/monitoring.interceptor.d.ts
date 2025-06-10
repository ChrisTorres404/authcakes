import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class MonitoringInterceptor implements NestInterceptor {
    private readonly logger;
    private readonly tracer;
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private sanitizeBody;
}
