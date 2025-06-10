import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'User UUID' }) id: string;
  @ApiProperty({ example: 'user@example.com', description: 'User email address' }) email: string;
  @ApiProperty({ example: 'John', description: 'User first name' }) firstName: string;
  @ApiProperty({ example: 'Doe', description: 'User last name' }) lastName: string;
  @ApiProperty({ example: 'user', enum: ['user', 'admin'], description: 'User role' }) role: string;
  @ApiProperty({ example: true, description: 'User active status' }) active: boolean;
  @ApiProperty({ example: true, description: 'Email verification status' }) emailVerified: boolean;
  @ApiProperty({ example: false, description: 'Phone verification status' }) phoneVerified: boolean;
  @ApiProperty({ example: 'https://cdn.example.com/avatar.jpg', required: false, description: 'User avatar URL' }) avatar?: string;
  // Add other safe fields as needed
}
