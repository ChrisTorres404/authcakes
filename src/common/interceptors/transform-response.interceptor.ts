import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const startTime = Date.now();
    
    // Generate request ID if not present
    const requestId = (request.headers['x-request-id'] as string) || uuidv4();
    request['id'] = requestId;
    
    // Set request ID in response headers
    response.setHeader('X-Request-Id', requestId);
    
    // Get API version from request
    const version = request['apiVersion'] || 'v1';

    return next.handle().pipe(
      // Calculate response time
      tap(() => {
        const responseTime = Date.now() - startTime;
        response.setHeader('X-Response-Time', `${responseTime}ms`);
      }),
      
      // Transform successful responses
      map((data) => {
        // Check if response is already wrapped
        if (data instanceof ApiResponseDto) {
          return data;
        }

        // Check if it's a file download or other special response
        if (response.getHeader('Content-Type')?.includes('application/octet-stream')) {
          return data;
        }

        // Wrap response in standard format
        return ApiResponseDto.success(data, {
          version,
          requestId,
          responseTime: Date.now() - startTime,
        });
      }),
      
      // Handle errors
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        
        // Handle HttpException
        if (error instanceof HttpException) {
          const status = error.getStatus();
          const errorResponse = error.getResponse();
          
          let errorData: any = {};
          if (typeof errorResponse === 'string') {
            errorData = {
              code: this.getErrorCode(status),
              message: errorResponse,
            };
          } else if (typeof errorResponse === 'object') {
            errorData = {
              code: errorResponse['error'] || this.getErrorCode(status),
              message: errorResponse['message'] || error.message,
              details: errorResponse['details'] || errorResponse['errors'],
            };
          }
          
          const apiError = ApiResponseDto.error(
            errorData.code,
            errorData.message,
            errorData.details,
            {
              version,
              requestId,
              responseTime,
            }
          );
          
          // Set appropriate status code
          response.status(status);
          
          return throwError(() => apiError);
        }
        
        // Handle unexpected errors
        const apiError = ApiResponseDto.error(
          'INTERNAL_SERVER_ERROR',
          process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : error.message || 'An unexpected error occurred',
          process.env.NODE_ENV === 'production' ? undefined : error.stack,
          {
            version,
            requestId,
            responseTime,
          }
        );
        
        // Set 500 status for unexpected errors
        response.status(HttpStatus.INTERNAL_SERVER_ERROR);
        
        return throwError(() => apiError);
      }),
    );
  }

  private getErrorCode(status: number): string {
    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };
    
    return errorCodes[status] || 'UNKNOWN_ERROR';
  }
}