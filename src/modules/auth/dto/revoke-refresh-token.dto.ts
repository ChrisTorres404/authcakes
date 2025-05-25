import { IsString, IsOptional } from 'class-validator';

export class RevokeRefreshTokenDto {
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  revokedBy?: string;

  @IsOptional()
  @IsString()
  revocationReason?: string;
} 