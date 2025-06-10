import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordUserDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'user', enum: ['user', 'admin'] })
  role: string;

  @ApiProperty({ example: true })
  emailVerified: boolean;
}

export class ResetPasswordResponseDto {
  @ApiProperty({ type: ResetPasswordUserDto })
  user: ResetPasswordUserDto;
}