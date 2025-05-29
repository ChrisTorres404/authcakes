import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T = unknown> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiPropertyOptional({ description: 'Returned data' })
  data?: T;

  @ApiPropertyOptional({ example: 'Operation completed successfully.' })
  message?: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Not Found' })
  error: string;

  @ApiProperty({ example: 'Tenant not found' })
  message: string;

  @ApiProperty({
    example: 'TENANT_NOT_FOUND',
    description: 'Application-specific error code',
  })
  errorCode: string;
}
