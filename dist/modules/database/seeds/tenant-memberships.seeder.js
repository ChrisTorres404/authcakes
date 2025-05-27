"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedTenantMemberships = seedTenantMemberships;
const common_1 = require("@nestjs/common");
async function seedTenantMemberships(tenantMembershipRepository, userRepository, tenantRepository, options = {}) {
    const logger = new common_1.Logger('TenantMembershipsSeeder');
    const membershipsCount = await tenantMembershipRepository.count();
    if (membershipsCount === 0 || options.force) {
        if (membershipsCount > 0 && options.force) {
            logger.log('Force option enabled - seeding tenant memberships even though memberships already exist');
        }
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
        }
        else {
            logger.warn('Required users or tenant not found, skipping tenant memberships seeding');
        }
    }
    else {
        logger.log('Tenant memberships already exist, skipping seeding');
    }
}
//# sourceMappingURL=tenant-memberships.seeder.js.map