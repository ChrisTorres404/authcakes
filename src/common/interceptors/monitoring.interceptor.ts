import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { getTracer } from '../../config/monitoring.config';
import { Request, Response } from 'express';

@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
  private readonly logger = new Logger('MonitoringInterceptor');
  private readonly tracer = getTracer();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, headers, params, query, body } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    const ip = request.ip || headers['x-forwarded-for'] || 'unknown';

    // Start APM span
    const span = this.tracer.startSpan(`${method} ${url}`, {
      tags: {
        'http.method': method,
        'http.url': url,
        'http.user_agent': userAgent,
        'http.remote_addr': ip,
        'resource.name': `${method} ${request.route?.path || url}`,
      },
    });

    // Add request metadata
    span.setTag('http.request.params', JSON.stringify(params));
    span.setTag('http.request.query', JSON.stringify(query));
    
    // Add sanitized body (exclude sensitive fields)
    const sanitizedBody = this.sanitizeBody(body);
    if (sanitizedBody) {
      span.setTag('http.request.body', JSON.stringify(sanitizedBody));
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Add response metadata
          span.setTag('http.status_code', statusCode);
          span.setTag('http.response.duration_ms', duration);
          
          // Log slow requests
          if (duration > 1000) {
            this.logger.warn(`Slow request detected: ${method} ${url} took ${duration}ms`);
            span.setTag('performance.slow_request', true);
          }

          // Add custom business metrics
          if (url.includes('/auth/login') && statusCode === 201) {
            span.setTag('business.login.success', true);
          } else if (url.includes('/auth/register') && statusCode === 201) {
            span.setTag('business.registration.success', true);
          }

          span.finish();
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          
          span.setTag('error', true);
          span.setTag('error.type', error.name);
          span.setTag('error.message', error.message);
          span.setTag('error.stack', error.stack);
          span.setTag('http.status_code', error.status || 500);
          span.setTag('http.response.duration_ms', duration);

          // Log error details
          this.logger.error(
            `Request failed: ${method} ${url} - ${error.message}`,
            error.stack,
          );

          span.finish();
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'currentPassword',
      'newPassword',
      'token',
      'refreshToken',
      'accessToken',
      'apiKey',
      'secret',
      'creditCard',
      'ssn',
      'recoveryAnswer',
    ];

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}