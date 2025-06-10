import { ApiProperty } from '@nestjs/swagger';

export class RequestAccountRecoveryResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ 
    example: 'dev-recovery-token',
    required: false,
    description: 'Recovery token (only returned in development mode)'
  })
  recoveryToken?: string;
}

export class CompleteAccountRecoveryResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}