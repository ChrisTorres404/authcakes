import { ApiProperty } from '@nestjs/swagger';

export class MfaEnrollResponseDto {
  @ApiProperty({ example: 'BASE32SECRET' })
  secret: string;

  @ApiProperty({ 
    example: 'otpauth://totp/Service:user@example.com?secret=BASE32SECRET&issuer=Service',
    required: false 
  })
  otpauth_url?: string;

  @ApiProperty({ example: 'pending' })
  setupStatus: string;
}

export class MfaVerifyResponseDto {
  @ApiProperty({ 
    example: 'MFA enabled successfully',
    required: false 
  })
  message?: string;

  @ApiProperty({ 
    type: [String],
    example: ['ABC123', 'DEF456', 'GHI789'],
    required: false,
    description: 'Recovery codes (only returned when first enabling MFA)'
  })
  recoveryCodes?: string[];
}