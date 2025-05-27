"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedUserDevices = seedUserDevices;
const common_1 = require("@nestjs/common");
async function seedUserDevices(userDeviceRepository, userRepository, options = {}) {
    const logger = new common_1.Logger('UserDevicesSeeder');
    const count = await userDeviceRepository.count();
    if (count === 0 || options.force) {
        if (count > 0 && options.force) {
            logger.log('Force option enabled - seeding user devices even though devices already exist');
        }
        logger.log('Seeding user devices...');
        const adminUser = await userRepository.findOne({ where: { email: 'admin@example.com' } });
        if (adminUser) {
            const device = userDeviceRepository.create({
                userId: adminUser.id,
                deviceId: 'admin-device-1',
                deviceType: 'laptop',
                lastLogin: new Date(),
                trusted: true,
            });
            await userDeviceRepository.save(device);
            logger.log('User device seeded for admin user');
        }
        else {
            logger.warn('Admin user not found, skipping user devices seeding');
        }
    }
    else {
        logger.log('User devices already exist, skipping seeding');
    }
}
//# sourceMappingURL=user-devices.seeder.js.map