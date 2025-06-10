import { ApiProperty } from '@nestjs/swagger';

class DeviceInfoDto {
  @ApiProperty({ example: '127.0.0.1', required: false })
  ip?: string;

  @ApiProperty({ example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', required: false })
  userAgent?: string;

  @ApiProperty({ example: 'desktop', required: false })
  type?: string;

  @ApiProperty({ example: 'Windows', required: false })
  platform?: string;

  @ApiProperty({ example: 'Chrome', required: false })
  browser?: string;

  @ApiProperty({ example: '120.0.0.0', required: false })
  version?: string;
}

class SessionDto {
  @ApiProperty({ example: 'uuid-of-session' })
  id: string;

  @ApiProperty({ example: '2024-06-01T12:00:00Z' })
  createdAt: string;

  @ApiProperty({ type: DeviceInfoDto })
  deviceInfo: DeviceInfoDto;

  @ApiProperty({ example: '2024-06-01T12:30:00Z' })
  lastUsedAt: string;
}

export class SessionListResponseDto {
  @ApiProperty({ type: [SessionDto] })
  sessions: SessionDto[];
}
