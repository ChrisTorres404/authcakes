import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for user self-updates with only safe fields
 * This is a restricted subset of fields from the full User entity
 * that are safe for users to update about themselves
 */
export class UpdateUserProfileDto {
  @ApiPropertyOptional({ example: 'Jane', description: "User's first name", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Smith', description: "User's last name", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/new-avatar.jpg', description: "URL to user's avatar image" })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 'Tech Startup Inc.', description: "User's company name", maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @ApiPropertyOptional({ example: 'Product Design', description: "User's department within company", maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  department?: string;

  @ApiPropertyOptional({ example: 'Canada', description: "User's country", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: 'Ontario', description: "User's state/province", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: '456 Oak Avenue', description: "User's address line 1", maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'Floor 12', description: "User's address line 2", maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address2?: string;

  @ApiPropertyOptional({ example: 'Toronto', description: "User's city", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'M5V 3A8', description: "User's ZIP/postal code", maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @ApiPropertyOptional({ example: 'Passionate about creating user-friendly interfaces and solving complex problems', description: "User's biographical information", maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;
}
