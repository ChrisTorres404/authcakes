import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() role: string;
  @ApiProperty() active: boolean;
  @ApiProperty() emailVerified: boolean;
  @ApiProperty({ required: false }) avatar?: string;
  // Add other safe fields as needed
}
