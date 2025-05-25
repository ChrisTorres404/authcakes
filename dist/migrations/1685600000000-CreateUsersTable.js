"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUsersTable1685600000000 = void 0;
class CreateUsersTable1685600000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar NOT NULL UNIQUE,
        "password" varchar NOT NULL,
        "role" varchar NOT NULL DEFAULT 'user',
        "active" boolean NOT NULL DEFAULT true,
        "firstName" varchar,
        "lastName" varchar,
        "avatar" varchar,
        "emailVerified" boolean NOT NULL DEFAULT true,
        "phoneNumber" varchar,
        "phoneVerified" boolean NOT NULL DEFAULT false,
        "emailVerificationToken" varchar,
        "phoneVerificationToken" varchar,
        "resetToken" varchar,
        "resetTokenExpiry" TIMESTAMP,
        "failedLoginAttempts" integer NOT NULL DEFAULT 0,
        "lockedUntil" TIMESTAMP,
        "lastLogin" TIMESTAMP,
        "company" varchar,
        "department" varchar,
        "country" varchar,
        "state" varchar,
        "address" varchar,
        "address2" varchar,
        "city" varchar,
        "zipCode" varchar,
        "bio" text,
        "mfaEnabled" boolean NOT NULL DEFAULT false,
        "mfaSecret" varchar,
        "mfaType" varchar,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_email" ON "users" ("email");
    `);
    }
    async down(queryRunner) {
        await queryRunner.query('DROP TABLE IF EXISTS "users"');
    }
}
exports.CreateUsersTable1685600000000 = CreateUsersTable1685600000000;
//# sourceMappingURL=1685600000000-CreateUsersTable.js.map