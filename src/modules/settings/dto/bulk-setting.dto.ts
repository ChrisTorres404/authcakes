import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkSettingDto {
  @ApiProperty({ example: 'siteName' })
  key: string;

  @ApiProperty({ example: 'My App' })
  value: any;

  @ApiPropertyOptional({ example: 'string' })
  type?: string;

  @ApiPropertyOptional({ example: 'The name of the site' })
  description?: string;
}
