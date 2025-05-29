// src/modules/auth/dto/revoke-session.dto.ts
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class RevokeSessionDto {
  @IsUUID()
  sessionId: string;

  @IsOptional()
  @IsString()
  revokedBy?: string | null;
}
