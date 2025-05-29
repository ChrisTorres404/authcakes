import { ApiProperty } from '@nestjs/swagger';
import { LoginUserDto } from './login-response.dto';

export class TokenResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: LoginUserDto })
  user: LoginUserDto;

  @ApiProperty({ example: 'access.jwt.token' })
  accessToken: string;

  @ApiProperty({ example: 'refresh.jwt.token' })
  refreshToken: string;
}
