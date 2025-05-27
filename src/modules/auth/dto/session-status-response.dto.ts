import { ApiProperty } from '@nestjs/swagger';

export class SessionStatusResponseDto {
  @ApiProperty({ example: true })
  valid: boolean;

  @ApiProperty({ example: 900 })
  remainingSeconds: number;

  @ApiProperty({ example: 'uuid-of-session' })
  sessionId: string;
} 