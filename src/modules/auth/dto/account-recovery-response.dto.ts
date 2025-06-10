import { ApiProperty } from '@nestjs/swagger';

export class RequestAccountRecoveryResponseDto {
  @ApiProperty({ 
    example: 'dev-recovery-token',
    required: false,
    description: 'Recovery token (only returned in development mode)'
  })
  recoveryToken?: string;
}

export class CompleteAccountRecoveryResponseDto {
  // Empty DTO since TransformResponseInterceptor adds success wrapper
}