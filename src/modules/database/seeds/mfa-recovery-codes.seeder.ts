import { Repository } from 'typeorm';
import { MfaRecoveryCode } from '../../auth/entities/mfa-recovery-code.entity';
import { User } from '../../users/entities/user.entity';
import { Logger } from '@nestjs/common';
import { SeederOptions } from './seeder.service';

export async function seedMfaRecoveryCodes(
  mfaRecoveryCodeRepository: Repository<MfaRecoveryCode>,
  userRepository: Repository<User>,
  options: SeederOptions = {},
) {
  const logger = new Logger('MfaRecoveryCodesSeeder');
  const count = await mfaRecoveryCodeRepository.count();
  if (count === 0 || options.force) {
    if (count > 0 && options.force) {
      logger.log(
        'Force option enabled - seeding MFA recovery codes even though codes already exist',
      );
    }
    logger.log('Seeding MFA recovery codes...');
    const adminUser = await userRepository.findOne({
      where: { email: 'admin@example.com' },
    });
    if (adminUser) {
      const codes = Array.from({ length: 5 }).map((_, i) =>
        mfaRecoveryCodeRepository.create({
          userId: adminUser.id,
          code: `ADMIN-MFA-${i + 1}`,
          used: false,
        }),
      );
      await mfaRecoveryCodeRepository.save(codes);
      logger.log('MFA recovery codes seeded for admin user');
    } else {
      logger.warn('Admin user not found, skipping MFA recovery codes seeding');
    }
  } else {
    logger.log('MFA recovery codes already exist, skipping seeding');
  }
}
