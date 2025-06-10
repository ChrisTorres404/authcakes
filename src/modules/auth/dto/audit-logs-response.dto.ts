import { ApiProperty } from '@nestjs/swagger';

export class AuditLogsResponseDto {
  @ApiProperty({ example: 'Audit logs not implemented yet' })
  message: string;
}