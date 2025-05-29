import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    example: '2024-05-28T12:34:56.000Z',
  })
  timestamp: string;
}
