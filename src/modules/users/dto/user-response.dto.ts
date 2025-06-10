import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'User UUID' }) id: string;
  @ApiProperty({ example: 'user@example.com', description: 'User email address' }) email: string;
  @ApiProperty({ example: 'John', description: 'User first name' }) firstName: string;
  @ApiProperty({ example: 'Doe', description: 'User last name' }) lastName: string;
  @ApiProperty({ example: 'user', enum: ['user', 'admin'], description: 'User role' }) role: string;
  @ApiProperty({ example: true, description: 'User active status' }) active: boolean;
  @ApiProperty({ example: true, description: 'Email verification status' }) emailVerified: boolean;
  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.jpg', description: 'User avatar URL' }) avatar?: string;
  @ApiPropertyOptional({ example: '+1234567890', description: 'User phone number' }) phoneNumber?: string;
  @ApiPropertyOptional({ example: false, description: 'Phone verification status' }) phoneVerified?: boolean;
  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z', type: 'string', format: 'date-time', description: 'Last login timestamp' }) lastLogin?: Date;
  @ApiPropertyOptional({ example: 'Acme Corporation', description: 'User company' }) company?: string;
  @ApiPropertyOptional({ example: 'Engineering', description: 'User department' }) department?: string;
  @ApiPropertyOptional({ example: 'United States', description: 'User country' }) country?: string;
  @ApiPropertyOptional({ example: 'California', description: 'User state/province' }) state?: string;
  @ApiPropertyOptional({ example: '123 Main Street', description: 'User address line 1' }) address?: string;
  @ApiPropertyOptional({ example: 'Suite 456', description: 'User address line 2' }) address2?: string;
  @ApiPropertyOptional({ example: 'San Francisco', description: 'User city' }) city?: string;
  @ApiPropertyOptional({ example: '94105', description: 'User postal/zip code' }) zipCode?: string;
  @ApiPropertyOptional({ example: 'Software engineer with 10+ years of experience', description: 'User biography' }) bio?: string;
  @ApiPropertyOptional({ example: false, description: 'MFA enabled status' }) mfaEnabled?: boolean;
  @ApiPropertyOptional({ example: 'totp', enum: ['totp', 'sms'], description: 'MFA type' }) mfaType?: string;
  @ApiProperty({ example: '2024-01-01T00:00:00Z', type: 'string', format: 'date-time', description: 'User creation timestamp' }) createdAt: Date;
  @ApiProperty({ example: '2024-01-15T10:30:00Z', type: 'string', format: 'date-time', description: 'User last update timestamp' }) updatedAt: Date;
}
