import { ApiProperty } from '@nestjs/swagger';

export class AuditLogsResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Audit logs not implemented yet' })
  message: string;
}