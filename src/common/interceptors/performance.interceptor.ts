import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

interface PerformanceMetrics {
  method: string;
  url: string;
  duration: number;
  timestamp: Date;
}

@Injectable()
export class PerformanceInterceptor
  implements NestInterceptor<unknown, unknown>
{
  private readonly logger = new Logger('Performance');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      tap({
        next: () => this.logPerformance(req, now),
        error: (error) => {
          const metrics = this.generateMetrics(req, now);
          if (error instanceof Error) {
            this.logger.error(
              `Error in ${metrics.method} ${metrics.url} after ${metrics.duration}ms`,
              error.stack,
            );
          } else {
            this.logger.error(
              `Error in ${metrics.method} ${metrics.url} after ${metrics.duration}ms`,
              String(error),
            );
          }
        },
      }),
    );
  }

  private generateMetrics(req: Request, startTime: number): PerformanceMetrics {
    return {
      method: req.method,
      url: req.url,
      duration: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  private logPerformance(req: Request, startTime: number): void {
    const metrics = this.generateMetrics(req, startTime);
    this.logger.log(
      `${metrics.method} ${metrics.url} - ${metrics.duration}ms`,
      { metrics },
    );
  }
}
