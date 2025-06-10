import { faker } from '@faker-js/faker';
import { User } from '../../src/modules/users/entities/user.entity';
import { DeepPartial } from 'typeorm';

export class UserFactory {
  static create(overrides?: DeepPartial<User>): User {
    const user = new User();
    
    user.id = overrides?.id || faker.string.uuid();
    user.email = overrides?.email || faker.internet.email();
    user.password = overrides?.password || faker.internet.password({ length: 12 });
    user.firstName = overrides?.firstName || faker.person.firstName();
    user.lastName = overrides?.lastName || faker.person.lastName();
    user.role = overrides?.role || 'user';
    user.isActive = overrides?.isActive !== undefined ? overrides.isActive : true;
    user.emailVerified = overrides?.emailVerified !== undefined ? overrides.emailVerified : false;
    user.mfaEnabled = overrides?.mfaEnabled !== undefined ? overrides.mfaEnabled : false;
    user.phoneNumber = overrides?.phoneNumber || faker.phone.number();
    user.avatar = overrides?.avatar || faker.image.avatar();
    user.lastLoginAt = overrides?.lastLoginAt || null;
    user.passwordChangedAt = overrides?.passwordChangedAt || new Date();
    user.createdAt = overrides?.createdAt || new Date();
    user.updatedAt = overrides?.updatedAt || new Date();
    
    // OTP fields
    user.otpSecret = overrides?.otpSecret || null;
    user.otpBackupCodes = overrides?.otpBackupCodes || null;
    user.otpEnabledAt = overrides?.otpEnabledAt || null;
    
    // Account recovery fields
    user.accountRecoveryEmail = overrides?.accountRecoveryEmail || null;
    user.accountRecoveryEmailVerified = overrides?.accountRecoveryEmailVerified || false;
    user.accountRecoveryPhone = overrides?.accountRecoveryPhone || null;
    user.accountRecoveryPhoneVerified = overrides?.accountRecoveryPhoneVerified || false;
    
    // Profile update settings
    user.canUpdateEmail = overrides?.canUpdateEmail !== undefined ? overrides.canUpdateEmail : true;
    user.canUpdatePhone = overrides?.canUpdatePhone !== undefined ? overrides.canUpdatePhone : true;
    user.canUpdatePassword = overrides?.canUpdatePassword !== undefined ? overrides.canUpdatePassword : true;
    user.canUpdateProfile = overrides?.canUpdateProfile !== undefined ? overrides.canUpdateProfile : true;
    
    return user;
  }

  static createMany(count: number, overrides?: DeepPartial<User>): User[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createWithHashedPassword(password: string, overrides?: DeepPartial<User>): User {
    const bcrypt = require('bcrypt');
    const hashedPassword = bcrypt.hashSync(password, 10);
    return this.create({ ...overrides, password: hashedPassword });
  }

  static createVerified(overrides?: DeepPartial<User>): User {
    return this.create({
      ...overrides,
      emailVerified: true,
      isActive: true,
    });
  }

  static createAdmin(overrides?: DeepPartial<User>): User {
    return this.create({
      ...overrides,
      role: 'admin',
      emailVerified: true,
      isActive: true,
    });
  }

  static createWithMfa(overrides?: DeepPartial<User>): User {
    return this.create({
      ...overrides,
      mfaEnabled: true,
      otpSecret: faker.string.alphanumeric(32),
      otpEnabledAt: new Date(),
      otpBackupCodes: JSON.stringify(Array.from({ length: 10 }, () => faker.string.alphanumeric(8))),
    });
  }
}