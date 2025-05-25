import { Repository } from 'typeorm';
import { TenantInvitation } from '../../tenants/entities/tenant-invitation.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Logger } from '@nestjs/common';

export async function seedOrganizationInvitations(
  invitationRepository: Repository<TenantInvitation>,
  userRepository: Repository<User>,
  tenantRepository: Repository<Tenant>,
) {
  const logger = new Logger('OrganizationInvitationsSeeder');
  const count = await invitationRepository.count();
  if (count === 0) {
    logger.log('Seeding organization invitations...');
    const adminUser = await userRepository.findOne({ where: { email: 'admin@example.com' } });
    const demoTenant = await tenantRepository.findOne({ where: { slug: 'demo-org' } });
    if (adminUser && demoTenant) {
      const invitation = invitationRepository.create({
        tenantId: demoTenant.id,
        invitedBy: adminUser.id,
        email: 'invitee@example.com',
        role: 'member',
        token: 'demo-invite-token-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await invitationRepository.save(invitation);
      logger.log('Demo organization invitation seeded for admin user and demo tenant');
    } else {
      logger.warn('Admin user or demo tenant not found, skipping organization invitations seeding');
    }
  } else {
    logger.log('Organization invitations already exist, skipping seeding');
  }
} 