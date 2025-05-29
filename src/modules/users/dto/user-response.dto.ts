import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() role: string;
  @ApiProperty() active: boolean;
  @ApiProperty() emailVerified: boolean;
  @ApiPropertyOptional() avatar?: string;
  @ApiPropertyOptional() phoneNumber?: string;
  @ApiPropertyOptional() phoneVerified?: boolean;
  @ApiPropertyOptional() lastLogin?: Date;
  @ApiPropertyOptional() company?: string;
  @ApiPropertyOptional() department?: string;
  @ApiPropertyOptional() country?: string;
  @ApiPropertyOptional() state?: string;
  @ApiPropertyOptional() address?: string;
  @ApiPropertyOptional() address2?: string;
  @ApiPropertyOptional() city?: string;
  @ApiPropertyOptional() zipCode?: string;
  @ApiPropertyOptional() bio?: string;
  @ApiPropertyOptional() mfaEnabled?: boolean;
  @ApiPropertyOptional() mfaType?: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
