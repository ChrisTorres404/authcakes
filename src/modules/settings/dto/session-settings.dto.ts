import { ApiProperty } from '@nestjs/swagger';

export class SessionSettingsDto {
  @ApiProperty({
    example: 30,
    description: 'Global session timeout in minutes.',
  })
  globalTimeoutMinutes: number;

  @ApiProperty({
    example: 60,
    description: 'Time in seconds before session timeout to show warning.',
  })
  warningTimeSeconds: number;

  @ApiProperty({
    example: true,
    description: 'Whether to show session timeout warning.',
  })
  showWarning: boolean;

  @ApiProperty({
    example: '/login',
    description: 'URL to redirect to after session timeout.',
  })
  redirectUrl: string;

  @ApiProperty({
    example: 'Your session is about to expire. Would you like to continue?',
    description: 'Warning message to display before session timeout.',
  })
  warningMessage: string;

  @ApiProperty({
    example: 5,
    description: 'Maximum number of sessions per user.',
  })
  maxSessionsPerUser: number;

  @ApiProperty({
    example: false,
    description: 'Whether to enforce single session per user.',
  })
  enforceSingleSession: boolean;
}
