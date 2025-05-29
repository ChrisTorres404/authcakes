import { ApiProperty } from '@nestjs/swagger';

export class ApiInfoDto {
  @ApiProperty({ example: 'AuthCakes API' })
  name: string;

  @ApiProperty({ example: '1.0.0' })
  version: string;

  @ApiProperty({ example: 'ok', enum: ['ok'] })
  status: 'ok';

  @ApiProperty({ type: 'string', format: 'date-time' })
  timestamp: string;
}
