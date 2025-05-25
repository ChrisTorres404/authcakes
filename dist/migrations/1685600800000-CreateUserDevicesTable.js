"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserDevicesTable1685600800000 = void 0;
class CreateUserDevicesTable1685600800000 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_devices" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "deviceId" varchar NOT NULL,
        "deviceType" varchar,
        "deviceName" varchar,
        "lastUsedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_device_user_deviceId" UNIQUE ("userId", "deviceId"),
        CONSTRAINT "FK_user_devices_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "IDX_user_devices_userId" ON "user_devices" ("userId");
      CREATE INDEX IF NOT EXISTS "IDX_user_devices_deviceId" ON "user_devices" ("deviceId");
    `);
    }
    async down(queryRunner) {
        await queryRunner.query('DROP TABLE IF EXISTS "user_devices"');
    }
}
exports.CreateUserDevicesTable1685600800000 = CreateUserDevicesTable1685600800000;
//# sourceMappingURL=1685600800000-CreateUserDevicesTable.js.map