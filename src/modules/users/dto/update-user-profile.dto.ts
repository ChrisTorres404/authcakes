import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for user self-updates with only safe fields
 * This is a restricted subset of fields from the full User entity
 * that are safe for users to update about themselves
 */
export class UpdateUserProfileDto {
  @ApiPropertyOptional({ description: "User's first name" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ description: "User's last name" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ description: "URL to user's avatar image" })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: "User's company name" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @ApiPropertyOptional({ description: "User's department within company" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  department?: string;

  @ApiPropertyOptional({ description: "User's country" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ description: "User's state/province" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ description: "User's address line 1" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ description: "User's address line 2" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address2?: string;

  @ApiPropertyOptional({ description: "User's city" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: "User's ZIP/postal code" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @ApiPropertyOptional({ description: "User's biographical information" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;
}
