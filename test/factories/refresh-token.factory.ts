import { faker } from '@faker-js/faker';
import { RefreshToken } from '../../src/modules/auth/entities/refresh-token.entity';
import { User } from '../../src/modules/users/entities/user.entity';
import { Session } from '../../src/modules/auth/entities/session.entity';
import { DeepPartial } from 'typeorm';

export class RefreshTokenFactory {
  static create(user: User, session: Session, overrides?: DeepPartial<RefreshToken>): RefreshToken {
    const refreshToken = new RefreshToken();
    
    refreshToken.id = overrides?.id || faker.string.uuid();
    refreshToken.tokenHash = overrides?.tokenHash || faker.string.alphanumeric(64);
    refreshToken.user = user;
    refreshToken.userId = user.id;
    refreshToken.session = session;
    refreshToken.sessionId = session.id;
    refreshToken.family = overrides?.family || faker.string.uuid();
    refreshToken.isRevoked = overrides?.isRevoked !== undefined ? overrides.isRevoked : false;
    refreshToken.revokedAt = overrides?.revokedAt || null;
    refreshToken.revokedReason = overrides?.revokedReason || null;
    refreshToken.deviceInfo = overrides?.deviceInfo || {
      browser: 'Chrome',
      os: 'Windows',
      device: 'Desktop',
    };
    refreshToken.expiresAt = overrides?.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    refreshToken.createdAt = overrides?.createdAt || new Date();
    refreshToken.updatedAt = overrides?.updatedAt || new Date();
    
    return refreshToken;
  }

  static createRevoked(user: User, session: Session, reason: string, overrides?: DeepPartial<RefreshToken>): RefreshToken {
    return this.create(user, session, {
      ...overrides,
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    });
  }

  static createExpired(user: User, session: Session, overrides?: DeepPartial<RefreshToken>): RefreshToken {
    return this.create(user, session, {
      ...overrides,
      expiresAt: new Date(Date.now() - 1000), // 1 second ago
    });
  }

  static createFamily(count: number, user: User, session: Session, family?: string): RefreshToken[] {
    const familyId = family || faker.string.uuid();
    return Array.from({ length: count }, () => 
      this.create(user, session, { family: familyId })
    );
  }
}