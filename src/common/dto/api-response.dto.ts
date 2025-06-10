import { ApiProperty } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';

export class ApiErrorDto {
  @ApiProperty({
    description: 'Error code for client-side handling',
    example: 'VALIDATION_ERROR',
  })
  code: string;

  @ApiProperty({
    description: 'Human-readable error message',
    example: 'Validation failed',
  })
  message: string;

  @ApiProperty({
    description: 'Additional error details',
    required: false,
    example: [{ field: 'email', constraints: { isEmail: 'email must be an email' } }],
  })
  details?: any;
}

export class ApiMetadataDto {
  @ApiProperty({
    description: 'Response timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'API version',
    example: 'v1',
  })
  version: string;

  @ApiProperty({
    description: 'Unique request identifier for tracing',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  requestId: string;

  @ApiProperty({
    description: 'Response time in milliseconds',
    example: 45,
    required: false,
  })
  responseTime?: number;
}

export class ApiResponseDto<T = any> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response data',
    required: false,
  })
  data?: T;

  @ApiProperty({
    description: 'Error information if request failed',
    type: ApiErrorDto,
    required: false,
  })
  error?: ApiErrorDto;

  @ApiProperty({
    description: 'Response metadata',
    type: ApiMetadataDto,
  })
  metadata: ApiMetadataDto;

  constructor(partial?: Partial<ApiResponseDto<T>>) {
    Object.assign(this, partial);
    
    // Set defaults if not provided
    if (!this.metadata) {
      this.metadata = {
        timestamp: new Date(),
        version: 'v1',
        requestId: uuidv4(),
      };
    }
  }

  static success<T>(data: T, metadata?: Partial<ApiMetadataDto>): ApiResponseDto<T> {
    return new ApiResponseDto({
      success: true,
      data,
      metadata: {
        timestamp: new Date(),
        version: metadata?.version || 'v1',
        requestId: metadata?.requestId || uuidv4(),
        responseTime: metadata?.responseTime,
      },
    });
  }

  static error(
    code: string,
    message: string,
    details?: any,
    metadata?: Partial<ApiMetadataDto>
  ): ApiResponseDto<null> {
    return new ApiResponseDto({
      success: false,
      error: {
        code,
        message,
        details,
      },
      metadata: {
        timestamp: new Date(),
        version: metadata?.version || 'v1',
        requestId: metadata?.requestId || uuidv4(),
        responseTime: metadata?.responseTime,
      },
    });
  }
}

// Pagination metadata
export class PaginationMetadataDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Indicates if there is a next page',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Indicates if there is a previous page',
    example: false,
  })
  hasPrevious: boolean;
}

export class PaginatedApiResponseDto<T> extends ApiResponseDto<T> {
  @ApiProperty({
    description: 'Pagination information',
    type: PaginationMetadataDto,
  })
  pagination: PaginationMetadataDto;

  static paginated<T>(
    data: T,
    pagination: PaginationMetadataDto,
    metadata?: Partial<ApiMetadataDto>
  ): PaginatedApiResponseDto<T> {
    const response = new PaginatedApiResponseDto({
      success: true,
      data,
      metadata: {
        timestamp: new Date(),
        version: metadata?.version || 'v1',
        requestId: metadata?.requestId || uuidv4(),
        responseTime: metadata?.responseTime,
      },
    });
    response.pagination = pagination;
    return response;
  }
}