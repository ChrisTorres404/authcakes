"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedWebauthnCredentials = seedWebauthnCredentials;
const common_1 = require("@nestjs/common");
async function seedWebauthnCredentials(webauthnCredentialRepository, userRepository, options = {}) {
    const logger = new common_1.Logger('WebauthnCredentialsSeeder');
    const count = await webauthnCredentialRepository.count();
    if (count === 0 || options.force) {
        if (count > 0 && options.force) {
            logger.log('Force option enabled - seeding WebAuthn credentials even though credentials already exist');
        }
        logger.log('Seeding WebAuthn credentials...');
        const adminUser = await userRepository.findOne({ where: { email: 'admin@example.com' } });
        if (adminUser) {
            const credential = webauthnCredentialRepository.create({
                userId: adminUser.id,
                credentialId: 'demo-credential-id',
                publicKey: 'demo-public-key',
                counter: 0,
                deviceName: 'Admin YubiKey',
            });
            await webauthnCredentialRepository.save(credential);
            logger.log('WebAuthn credential seeded for admin user');
        }
        else {
            logger.warn('Admin user not found, skipping WebAuthn credentials seeding');
        }
    }
    else {
        logger.log('WebAuthn credentials already exist, skipping seeding');
    }
}
//# sourceMappingURL=webauthn-credentials.seeder.js.map