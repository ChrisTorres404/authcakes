import { ApiProperty } from '@nestjs/swagger';

export class TokenSettingsDto {
  @ApiProperty({ example: 7, description: 'Refresh token duration in days.' })
  refreshTokenDuration: number;

  @ApiProperty({ example: 15, description: 'Access token duration in minutes.' })
  accessTokenDuration: number;
} 