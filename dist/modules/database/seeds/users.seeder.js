"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedUsers = seedUsers;
const bcrypt = require("bcrypt");
const common_1 = require("@nestjs/common");
async function seedUsers(userRepository, options = {}) {
    const logger = new common_1.Logger('UsersSeeder');
    const usersCount = await userRepository.count();
    if (usersCount === 0 || options.force) {
        if (usersCount > 0 && options.force) {
            logger.log('Force option enabled - seeding users even though users already exist');
        }
        logger.log('Seeding users...');
        const passwordHash = await bcrypt.hash('StrongP@ssw0rd!', 10);
        const adminUser = userRepository.create({
            email: 'admin@example.com',
            password: passwordHash,
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            emailVerified: true,
            phoneVerified: true,
            active: true,
        });
        await userRepository.save(adminUser);
        const demoUser = userRepository.create({
            email: 'demo@example.com',
            password: passwordHash,
            firstName: 'Demo',
            lastName: 'User',
            role: 'user',
            emailVerified: true,
            phoneVerified: true,
            active: true,
        });
        await userRepository.save(demoUser);
        logger.log('Users seeded successfully');
    }
    else {
        logger.log('Users already exist, skipping seeding');
    }
}
//# sourceMappingURL=users.seeder.js.map