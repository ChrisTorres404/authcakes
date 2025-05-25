"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnablePgcryptoExtension1685500000000 = void 0;
class EnablePgcryptoExtension1685500000000 {
    async up(queryRunner) {
        try {
            await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
            console.log('pgcrypto extension enabled successfully');
        }
        catch (error) {
            console.error('Failed to enable pgcrypto extension. You may need to enable it manually as a database superuser.');
            console.error('Error details:', error.message);
        }
    }
    async down(queryRunner) {
    }
}
exports.EnablePgcryptoExtension1685500000000 = EnablePgcryptoExtension1685500000000;
//# sourceMappingURL=1685500000000-EnablePgcryptoExtension.js.map