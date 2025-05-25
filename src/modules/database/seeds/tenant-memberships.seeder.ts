import { Repository } from 'typeorm';
import { TenantMembership } from '../../tenants/entities/tenant-membership.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Logger } from '@nestjs/common';

export async function seedTenantMemberships(
  tenantMembershipRepository: Repository<TenantMembership>,
  userRepository: Repository<User>,
  tenantRepository: Repository<Tenant>,
) {
  const logger = new Logger('TenantMembershipsSeeder');
  const membershipsCount = await tenantMembershipRepository.count();
  if (membershipsCount === 0) {
    logger.log('Seeding tenant memberships...');
    const adminUser = await userRepository.findOne({ where: { email: 'admin@example.com' } });
    const demoUser = await userRepository.findOne({ where: { email: 'demo@example.com' } });
    const demoTenant = await tenantRepository.findOne({ where: { slug: 'demo-org' } });
    if (adminUser && demoUser && demoTenant) {
      const adminMembership = tenantMembershipRepository.create({
        userId: adminUser.id,
        tenantId: demoTenant.id,
        role: 'admin',
      });
      await tenantMembershipRepository.save(adminMembership);
      const demoMembership = tenantMembershipRepository.create({
        userId: demoUser.id,
        tenantId: demoTenant.id,
        role: 'member',
      });
      await tenantMembershipRepository.save(demoMembership);
      logger.log('Tenant memberships seeded successfully');
    } else {
      logger.warn('Required users or tenant not found, skipping tenant memberships seeding');
    }
  } else {
    logger.log('Tenant memberships already exist, skipping seeding');
  }
} 