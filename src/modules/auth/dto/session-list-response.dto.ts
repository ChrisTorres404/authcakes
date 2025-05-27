import { ApiProperty } from '@nestjs/swagger';

class SessionDto {
  @ApiProperty({ example: 'uuid-of-session' })
  id: string;

  @ApiProperty({ example: '2024-06-01T12:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: { ip: '127.0.0.1', userAgent: 'Mozilla/5.0' } })
  deviceInfo: any;

  @ApiProperty({ example: '2024-06-01T12:30:00Z' })
  lastUsedAt: string;
}

export class SessionListResponseDto {
  @ApiProperty({ type: [SessionDto] })
  sessions: SessionDto[];
} 