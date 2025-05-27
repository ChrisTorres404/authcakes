import { Repository } from 'typeorm';
import { ApiKey } from '../../api/entities/api-key.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Logger } from '@nestjs/common';
import { SeederOptions } from './seeder.service';

export async function seedApiKeys(
  apiKeyRepository: Repository<ApiKey>,
  userRepository: Repository<User>,
  tenantRepository: Repository<Tenant>,
  options: SeederOptions = {},
) {
  const logger = new Logger('ApiKeysSeeder');
  const count = await apiKeyRepository.count();
  if (count === 0 || options.force) {
    if (count > 0 && options.force) {
      logger.log('Force option enabled - seeding API keys even though keys already exist');
    }
    logger.log('Seeding API keys...');
    const adminUser = await userRepository.findOne({ where: { email: 'admin@example.com' } });
    const demoTenant = await tenantRepository.findOne({ where: { slug: 'demo-org' } });
    if (adminUser && demoTenant) {
      const apiKey = apiKeyRepository.create({
        userId: adminUser.id,
        tenantId: demoTenant.id,
        name: 'Admin Demo Key',
        key: 'demo-api-key-123',
        permissions: { all: true },
        active: true,
      });
      await apiKeyRepository.save(apiKey);
      logger.log('Demo API key seeded for admin user and demo tenant');
    } else {
      logger.warn('Admin user or demo tenant not found, skipping API keys seeding');
    }
  } else {
    logger.log('API keys already exist, skipping seeding');
  }
}
