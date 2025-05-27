// src/modules/settings/dto/create-setting.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSettingDto {
  @ApiProperty({ example: 'siteName' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'My App' })
  @IsNotEmpty()
  value: any;

  @ApiPropertyOptional({ example: 'string', default: 'string' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'The name of the site' })
  @IsString()
  @IsOptional()
  description?: string;
}

