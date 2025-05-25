"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedTenants = seedTenants;
const common_1 = require("@nestjs/common");
async function seedTenants(tenantRepository) {
    const logger = new common_1.Logger('TenantsSeeder');
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
    }
    else {
        logger.log('Tenants already exist, skipping seeding');
    }
}
//# sourceMappingURL=tenants.seeder.js.map