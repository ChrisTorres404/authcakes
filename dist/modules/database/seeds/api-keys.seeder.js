"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedApiKeys = seedApiKeys;
const common_1 = require("@nestjs/common");
async function seedApiKeys(apiKeyRepository, userRepository, tenantRepository, options = {}) {
    const logger = new common_1.Logger('ApiKeysSeeder');
    const count = await apiKeyRepository.count();
    if (count === 0 || options.force) {
        if (count > 0 && options.force) {
            logger.log('Force option enabled - seeding API keys even though keys already exist');
        }
        logger.log('Seeding API keys...');
        const adminUser = await userRepository.findOne({
            where: { email: 'admin@example.com' },
        });
        const demoTenant = await tenantRepository.findOne({
            where: { slug: 'demo-org' },
        });
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
        }
        else {
            logger.warn('Admin user or demo tenant not found, skipping API keys seeding');
        }
    }
    else {
        logger.log('API keys already exist, skipping seeding');
    }
}
//# sourceMappingURL=api-keys.seeder.js.map