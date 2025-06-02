import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string | string[];
  timestamp: string;
  path: string;
  stack?: string;
  details?: Record<string, unknown>;
}

interface ValidationErrorResponse {
  message: string[];
  error: string;
  details?: Record<string, unknown>;
}

type HttpExceptionResponse = string | Record<string, unknown>;

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error: string | string[] = 'InternalServerError';
    let details: Record<string, unknown> | undefined;

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse() as HttpExceptionResponse;

      if (typeof response === 'string') {
        message = response;
        error = exception.name;
      } else if (typeof response === 'object') {
        const responseObj = response;
        message =
          (responseObj.message as string) || exception.message || message;
        error = (responseObj.error as string) || exception.name;
        if (responseObj.details) {
          details = responseObj.details as Record<string, unknown>;
        }
      }
      // Handle validation errors
      if (exception instanceof BadRequestException) {
        const response = exception.getResponse() as ValidationErrorResponse;
        if (Array.isArray(response.message)) {
          error = 'ValidationError';
          message = response.message;
          details = response.details;
        }
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
    } else if (this.isValidationError(exception)) {
      status = HttpStatus.BAD_REQUEST;
      error = 'ValidationError';
      message = exception.message || 'Validation failed';
      details = exception.details;
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    // Logging
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} ${status} - ${Array.isArray(message) ? message.join(', ') : message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} ${status} - ${Array.isArray(message) ? message.join(', ') : message}`,
      );
    }

    // Construct type-safe response
    const responseBody: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
    // Add development-only information (never expose in production/test)
    if (process.env.NODE_ENV === 'development' && process.env.EXPOSE_STACK_TRACE === 'true') {
      if (exception instanceof Error && exception.stack) {
        responseBody.stack = exception.stack;
      }
    }
    
    // Always include validation details for client-side error handling
    if (details && (status === HttpStatus.BAD_REQUEST || status === HttpStatus.UNPROCESSABLE_ENTITY)) {
      responseBody.details = details;
    }

    httpAdapter.reply(response, responseBody, status);
  }

  private isValidationError(exception: unknown): exception is {
    name: string;
    message: string;
    details: Record<string, unknown>;
  } {
    const err = exception as { name?: string };
    return err?.name === 'ValidationError';
  }
}
