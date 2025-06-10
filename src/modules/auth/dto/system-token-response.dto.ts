import { ApiProperty } from '@nestjs/swagger';

export class SystemTokenResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoic3lzdGVtIiwiY2xpZW50SWQiOiJtb2JpbGUtYXBwLXYxIiwiYXBpS2V5SGFzaCI6ImFiY2RlZjEyMzQ1Njc4OTAiLCJwZXJtaXNzaW9ucyI6WyJyZWFkIiwid3JpdGUiXSwiaWF0IjoxNjA5NDU5MjAwLCJleHAiOjE2MDk1NDU2MDAsImF1ZCI6IkF1dGhDYWtlcy1TeXN0ZW0iLCJpc3MiOiJBdXRoQ2FrZXMtQVBJIn0.signature',
    description: 'System JWT token',
  })
  token: string;

  @ApiProperty({
    example: 86400,
    description: 'Token expiration time in seconds',
  })
  expiresIn: number;

  @ApiProperty({
    example: 'Bearer',
    description: 'Token type',
  })
  tokenType: string;

  @ApiProperty({
    example: 'mobile-app-v1',
    description: 'Client identifier',
  })
  clientId: string;
}