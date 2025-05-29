import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ example: 'uuid-of-user' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'user', enum: ['user', 'admin'] })
  role: string;

  @ApiProperty({
    example: 'https://cdn.example.com/avatar.jpg',
    nullable: true,
  })
  avatar?: string;

  @ApiProperty({ example: true })
  emailVerified: boolean;
}

export class LoginResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: LoginUserDto })
  user: LoginUserDto;

  @ApiProperty({ example: 'uuid-of-session' })
  sessionId: string;

  @ApiProperty({ example: 'access.jwt.token' })
  accessToken: string;

  @ApiProperty({ example: 'refresh.jwt.token' })
  refreshToken: string;

  @ApiProperty({
    example: 'dev-verification-token',
    required: false,
    description: 'For development use only. Do not expose in production.',
  })
  verificationToken?: string;
}
