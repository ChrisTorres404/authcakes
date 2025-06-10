import { ApiProperty } from '@nestjs/swagger';

export class SocialLoginResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Social login not implemented yet' })
  message: string;
}