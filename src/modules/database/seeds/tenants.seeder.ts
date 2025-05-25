import { Repository } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Logger } from '@nestjs/common';

export async function seedTenants(tenantRepository: Repository<Tenant>) {
  const logger = new Logger('TenantsSeeder');
  const tenantsCount = await tenantRepository.count();
  if (tenantsCount === 0) {
    logger.log('Seeding tenants...');
    const demoTenant = tenantRepository.create({
      name: 'Demo Organization',
      slug: 'demo-org',
      active: true,
      settings: {
        allowUserInvites: true,
        defaultUserRole: 'member',
      },
    });
    await tenantRepository.save(demoTenant);
    logger.log('Tenants seeded successfully');
  } else {
    logger.log('Tenants already exist, skipping seeding');
  }
} 