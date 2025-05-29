"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedTenantInvitations = seedTenantInvitations;
const common_1 = require("@nestjs/common");
const tenant_invitation_dto_1 = require("../../tenants/dto/tenant-invitation.dto");
async function seedTenantInvitations(invitationRepository, userRepository, tenantRepository, options = {}) {
    const logger = new common_1.Logger('TenantInvitationsSeeder');
    const count = await invitationRepository.count();
    if (count === 0 || options.force) {
        if (count > 0 && options.force) {
            logger.log('Force option enabled - seeding organization invitations even though invitations already exist');
        }
        logger.log('Seeding organization invitations...');
        const adminUser = await userRepository.findOne({
            where: { email: 'admin@example.com' },
        });
        const demoTenant = await tenantRepository.findOne({
            where: { slug: 'demo-org' },
        });
        if (adminUser && demoTenant) {
            const invitation = invitationRepository.create({
                tenantId: demoTenant.id,
                invitedBy: adminUser.id,
                email: 'invitee@example.com',
                role: tenant_invitation_dto_1.TenantRole.MEMBER,
                token: 'demo-invite-token-123',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });
            await invitationRepository.save(invitation);
            logger.log('Demo organization invitation seeded for admin user and demo tenant');
        }
        else {
            logger.warn('Admin user or demo tenant not found, skipping organization invitations seeding');
        }
    }
    else {
        logger.log('Organization invitations already exist, skipping seeding');
    }
}
//# sourceMappingURL=tenant-invitations.seeder.js.map