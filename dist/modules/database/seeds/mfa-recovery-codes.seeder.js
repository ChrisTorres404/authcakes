"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedMfaRecoveryCodes = seedMfaRecoveryCodes;
const common_1 = require("@nestjs/common");
async function seedMfaRecoveryCodes(mfaRecoveryCodeRepository, userRepository) {
    const logger = new common_1.Logger('MfaRecoveryCodesSeeder');
    const count = await mfaRecoveryCodeRepository.count();
    if (count === 0) {
        logger.log('Seeding MFA recovery codes...');
        const adminUser = await userRepository.findOne({ where: { email: 'admin@example.com' } });
        if (adminUser) {
            const codes = Array.from({ length: 5 }).map((_, i) => mfaRecoveryCodeRepository.create({
                userId: adminUser.id,
                code: `ADMIN-MFA-${i + 1}`,
                used: false,
            }));
            await mfaRecoveryCodeRepository.save(codes);
            logger.log('MFA recovery codes seeded for admin user');
        }
        else {
            logger.warn('Admin user not found, skipping MFA recovery codes seeding');
        }
    }
    else {
        logger.log('MFA recovery codes already exist, skipping seeding');
    }
}
//# sourceMappingURL=mfa-recovery-codes.seeder.js.map