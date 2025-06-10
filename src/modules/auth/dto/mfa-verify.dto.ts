import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional } from 'class-validator';

export class MfaVerifyDto {
  @ApiProperty({ 
    example: '123456',
    description: 'The 6-digit TOTP code or recovery code'
  })
  @IsString()
  code: string;

  @ApiProperty({ 
    example: 'totp',
    enum: ['totp', 'recovery'],
    required: false,
    description: 'Type of code being verified'
  })
  @IsOptional()
  @IsIn(['totp', 'recovery'])
  type?: 'totp' | 'recovery';
}