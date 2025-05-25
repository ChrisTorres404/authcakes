// src/modules/auth/repositories/refresh-token.repository.ts
import { EntityRepository, Repository, MoreThan } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';

@EntityRepository(RefreshToken)
export class RefreshTokenRepository extends Repository<RefreshToken> {
  async findValidToken(token: string): Promise<RefreshToken | undefined> {
    const result = await this.findOne({
      where: {
        token,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      }
    });
    return result ?? undefined;
  }

  async revokeTokensByUser(userId: string): Promise<void> {
    await this.update(
      { user: { id: userId }, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
  }
  
  async cleanupExpiredTokens(): Promise<void> {
    // Delete tokens that are more than 30 days old and have been revoked
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await this.createQueryBuilder()
      .delete()
      .where('isRevoked = :isRevoked', { isRevoked: true })
      .andWhere('revokedAt < :date', { date: thirtyDaysAgo })
      .execute();
  }
}