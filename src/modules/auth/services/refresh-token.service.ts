import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { CreateRefreshTokenDto } from '../dto/create-refresh-token.dto';
import { RevokeRefreshTokenDto } from '../dto/revoke-refresh-token.dto';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async createRefreshToken(dto: CreateRefreshTokenDto): Promise<RefreshToken> {
    const refreshToken = this.refreshTokenRepository.create({
      user: { id: dto.userId } as any,
      session: dto.sessionId ? { id: dto.sessionId } as any : undefined,
      token: dto.token,
      expiresAt: new Date(dto.expiresAt),
      userAgent: dto.userAgent,
      ipAddress: dto.ipAddress,
      isRevoked: false,
    });
    return this.refreshTokenRepository.save(refreshToken);
  }

  async revokeRefreshToken(dto: RevokeRefreshTokenDto): Promise<void> {
    await this.refreshTokenRepository.update(
      { token: dto.token },
      {
        isRevoked: true,
        revokedAt: new Date(),
        revokedBy: dto.revokedBy,
        revocationReason: dto.revocationReason,
      },
    );
  }

  async listUserRefreshTokens(userId: string): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }
} 