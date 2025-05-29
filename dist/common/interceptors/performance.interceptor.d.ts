import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class PerformanceInterceptor implements NestInterceptor<unknown, unknown> {
    private readonly logger;
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
    private generateMetrics;
    private logPerformance;
}
