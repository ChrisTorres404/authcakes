// Continuing from the previous artifact...

// src/common/filters/all-exceptions.filter.ts (continued)
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    UnauthorizedException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ValidationError } from 'class-validator';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

    catch(exception: unknown, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const isProd = process.env.NODE_ENV === 'production';

        let status = 500;
        let message = 'Internal server error';
        let error: string | string[] = 'InternalServerError';
        let details: any = undefined;

        // Specialized handling
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'string') {
                message = res;
                error = exception.name;
            } else if (typeof res === 'object' && res !== null) {
                const obj = res as Record<string, any>;
                message = obj.message || exception.message || message;
                error = obj.error || exception.name;
                if (obj.details) details = obj.details;
            }
            // Validation errors
            if (
                exception instanceof BadRequestException &&
                Array.isArray((exception.getResponse() as any)?.message)
            ) {
                error = 'ValidationError';
                message = (exception.getResponse() as any).message;
            }
            // Auth errors
            if (exception instanceof UnauthorizedException) {
                error = 'Unauthorized';
                message = 'Authentication required';
            }
            if (exception instanceof ForbiddenException) {
                error = 'Forbidden';
                message = 'You do not have permission to access this resource';
            }
        } else if ((exception as any)?.name === 'ValidationError') {
            status = 400;
            error = 'ValidationError';
            message = (exception as any).message || 'Validation failed';
            details = (exception as any).details;
        } else if (exception instanceof Error) {
            message = exception.message;
            error = exception.name;
        }

        // Logging
        if (status >= 500) {
            this.logger.error(
                `[${request.method}] ${request.url} ${status} - ${message}`,
                exception instanceof Error ? exception.stack : undefined,
            );
        } else {
            this.logger.warn(
                `[${request.method}] ${request.url} ${status} - ${message}`,
            );
        }

        // Security: Hide stack trace and details unless in development
        const responseBody: any = {
            statusCode: status,
            message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url,
        };
        if (process.env.NODE_ENV === 'development' && exception instanceof Error && exception.stack) {
            responseBody.stack = exception.stack;
        }
        if (process.env.NODE_ENV === 'development' && details) {
            responseBody.details = details;
        }

        httpAdapter.reply(response, responseBody, status);
    }
}
  
 