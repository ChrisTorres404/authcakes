import { Repository } from 'typeorm';
import { Log } from '../../logs/entities/log.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Logger } from '@nestjs/common';
import { SeederOptions } from './seeder.service';

export async function seedLogs(
  logRepository: Repository<Log>,
  userRepository: Repository<User>,
  tenantRepository: Repository<Tenant>,
  options: SeederOptions = {},
) {
  const logger = new Logger('LogsSeeder');
  const count = await logRepository.count();
  if (count === 0 || options.force) {
    if (count > 0 && options.force) {
      logger.log('Force option enabled - seeding logs even though logs already exist');
    }
    logger.log('Seeding logs...');
    const adminUser = await userRepository.findOne({ where: { email: 'admin@example.com' } });
    const demoTenant = await tenantRepository.findOne({ where: { slug: 'demo-org' } });
    if (adminUser && demoTenant) {
      const log = logRepository.create({
        userId: adminUser.id,
        tenantId: demoTenant.id,
        action: 'login',
        ip: '127.0.0.1',
        userAgent: 'curl/7.79.1',
        details: { message: 'Admin user logged in.' },
        timestamp: new Date(),
      });
      await logRepository.save(log);
      logger.log('Demo log seeded for admin user and demo tenant');
    } else {
      logger.warn('Admin user or demo tenant not found, skipping logs seeding');
    }
  } else {
    logger.log('Logs already exist, skipping seeding');
  }
}
