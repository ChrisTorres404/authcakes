import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchUsersDto {
  @ApiProperty({ example: 'user@example.com', required: false, description: 'Search by email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'John', required: false, description: 'Search by first name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false, description: 'Search by last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'admin', enum: ['user', 'admin'], required: false, description: 'Search by role' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ example: 'Acme Corporation', required: false, description: 'Search by company' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ example: 'Engineering', required: false, description: 'Search by department' })
  @IsOptional()
  @IsString()
  department?: string;
}
