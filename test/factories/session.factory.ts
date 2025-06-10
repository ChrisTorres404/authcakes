import { faker } from '@faker-js/faker';
import { Session } from '../../src/modules/auth/entities/session.entity';
import { User } from '../../src/modules/users/entities/user.entity';
import { DeepPartial } from 'typeorm';

export class SessionFactory {
  static create(user: User, overrides?: DeepPartial<Session>): Session {
    const session = new Session();
    
    session.id = overrides?.id || faker.string.uuid();
    session.sessionToken = overrides?.sessionToken || faker.string.alphanumeric(64);
    session.user = user;
    session.userId = user.id;
    session.ipAddress = overrides?.ipAddress || faker.internet.ipv4();
    session.userAgent = overrides?.userAgent || faker.internet.userAgent();
    session.deviceInfo = overrides?.deviceInfo || {
      browser: 'Chrome',
      os: 'Windows',
      device: 'Desktop',
    };
    session.isActive = overrides?.isActive !== undefined ? overrides.isActive : true;
    session.lastActivityAt = overrides?.lastActivityAt || new Date();
    session.expiresAt = overrides?.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    session.createdAt = overrides?.createdAt || new Date();
    session.updatedAt = overrides?.updatedAt || new Date();
    
    return session;
  }

  static createExpired(user: User, overrides?: DeepPartial<Session>): Session {
    return this.create(user, {
      ...overrides,
      expiresAt: new Date(Date.now() - 1000), // 1 second ago
      isActive: false,
    });
  }

  static createInactive(user: User, overrides?: DeepPartial<Session>): Session {
    return this.create(user, {
      ...overrides,
      isActive: false,
    });
  }

  static createMany(count: number, user: User, overrides?: DeepPartial<Session>): Session[] {
    return Array.from({ length: count }, () => this.create(user, overrides));
  }
}