import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordResponseDto {
  @ApiProperty({ 
    example: 'Password changed successfully',
    required: false 
  })
  message?: string;
}