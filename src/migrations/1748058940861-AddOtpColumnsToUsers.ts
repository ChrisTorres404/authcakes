import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOtpColumnsToUsers1748058940861 implements MigrationInterface {
  name = 'AddOtpColumnsToUsers1748058940861';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_sessionId_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "sessions_userId_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" DROP CONSTRAINT "FK_api_keys_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" DROP CONSTRAINT "FK_api_keys_tenant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" DROP CONSTRAINT "FK_user_devices_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mfa_recovery_codes" DROP CONSTRAINT "FK_mfa_recovery_codes_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "webauthn_credentials" DROP CONSTRAINT "FK_webauthn_credentials_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs" DROP CONSTRAINT "FK_logs_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs" DROP CONSTRAINT "FK_logs_tenant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_memberships" DROP CONSTRAINT "FK_tenant_memberships_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_memberships" DROP CONSTRAINT "FK_tenant_memberships_tenant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_invitations" DROP CONSTRAINT "FK_org_invite_tenant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_invitations" DROP CONSTRAINT "FK_org_invite_invitedBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_invitations" DROP CONSTRAINT "FK_org_invite_acceptedBy"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_refresh_tokens_userId"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_refresh_tokens_sessionId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_refresh_tokens_expiresAt"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_refresh_tokens_isRevoked"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_refresh_tokens_token"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_sessions_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_sessions_expiresAt"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_sessions_isActive"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_sessions_revoked"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_api_keys_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_api_keys_tenantId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_api_keys_key"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_devices_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_devices_deviceId"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_mfa_recovery_codes_userId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_mfa_recovery_codes_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_webauthn_credentials_userId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_webauthn_credentials_credentialId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_logs_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_logs_tenantId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_logs_action"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_logs_timestamp"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tenant_memberships_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tenant_memberships_tenant_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_org_invite_tenantId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_org_invite_email"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_org_invite_token"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_tenants_slug"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_system_settings_type"`);
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "CHK_refresh_tokens_expires"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "CHK_refresh_tokens_revoked"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "CHK_sessions_expires"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "CHK_sessions_revoked"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" DROP CONSTRAINT "UQ_user_device_user_deviceId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "webauthn_credentials" DROP CONSTRAINT "UQ_webauthn_user_credential"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" DROP COLUMN "deviceName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" DROP COLUMN "lastUsedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ALTER COLUMN "deviceId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ALTER COLUMN "lastLogin" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ALTER COLUMN "trusted" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs" ALTER COLUMN "details" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "emailVerificationToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "emailVerificationToken" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "phoneVerificationToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "phoneVerificationToken" character varying(255)`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "resetToken"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "resetToken" character varying(255)`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mfaSecret"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "mfaSecret" character varying(255)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_610102b60fea1455310ccd299d" ON "refresh_tokens" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4542dd2f38a61354a040ba9fd5" ON "refresh_tokens" ("token") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_56b91d98f71e3d1b649ed6e9f3" ON "refresh_tokens" ("expiresAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_93d50353ef8c9b9b1ca2421a17" ON "refresh_tokens" ("isRevoked") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_57de40bc620f456c7311aa3a1e" ON "sessions" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_50762206f116cd47d1c3fec396" ON "sessions" ("expiresAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_39f8752ebc359f7595484507ca" ON "sessions" ("isActive") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_08a22e1217e17aea515cd7ab4a" ON "sessions" ("revoked") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6c2e267ae764a9413b863a2934" ON "api_keys" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e42cf55faeafdcce01a82d2484" ON "api_keys" ("key") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e12ac4f8016243ac71fd2e415a" ON "user_devices" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e81c41e04269a2d2152f0d60b5" ON "user_devices" ("deviceId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1aeec4efb39bc7c382cbce9994" ON "mfa_recovery_codes" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e6f17432bf91510411c796ef78" ON "mfa_recovery_codes" ("code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4e5d1a5131f49fdbc410b8ded0" ON "webauthn_credentials" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_be2025ac9c82bdadcf340b3dfc" ON "webauthn_credentials" ("credentialId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_807abb1f01d751e24c2a5fda8e" ON "logs" ("action") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_682897ba764db30ef8836c9b74" ON "logs" ("timestamp") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c1d63ed5127c053e50abcdbce5" ON "tenant_invitations" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7dfa5b36a9305efc5b7e9f369a" ON "tenant_invitations" ("token") `,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "CHK_6d668d5831681657a7029ee87a" CHECK (("isRevoked" = false) OR ("isRevoked" = true AND "revokedAt" IS NOT NULL))`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "CHK_b2902f12bf1a3f5e6d32e97eb3" CHECK ("expiresAt" > "createdAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "CHK_28e3764c2f42fae67c1e20bcc5" CHECK (("revoked" = false) OR ("revoked" = true AND "revokedAt" IS NOT NULL))`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "CHK_cae46de039467f3011904a5191" CHECK ("expiresAt" > "createdAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "UQ_c5be2da517dc03e3fff87040bf0" UNIQUE ("userId", "credentialId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_b25a58a00578bd1b7a01623d2dd" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" ADD CONSTRAINT "FK_6c2e267ae764a9413b863a29342" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" ADD CONSTRAINT "FK_2cd545077d6e6e8378b051cf1b7" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ADD CONSTRAINT "FK_e12ac4f8016243ac71fd2e415af" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mfa_recovery_codes" ADD CONSTRAINT "FK_1aeec4efb39bc7c382cbce99948" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "FK_4e5d1a5131f49fdbc410b8ded04" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs" ADD CONSTRAINT "FK_a1196a1956403417fe3a0343390" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs" ADD CONSTRAINT "FK_cbffea25c132854fe6017804645" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_memberships" ADD CONSTRAINT "FK_7427b391abdef33b40124c15822" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_memberships" ADD CONSTRAINT "FK_d22937ebccd641b5090849e51f7" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_invitations" ADD CONSTRAINT "FK_2088360151a394f86567f3798c9" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_invitations" ADD CONSTRAINT "FK_9d9887246251d5e24acef860bcb" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_invitations" ADD CONSTRAINT "FK_991c21099dfe1d19fae93076a43" FOREIGN KEY ("acceptedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenant_invitations" DROP CONSTRAINT "FK_991c21099dfe1d19fae93076a43"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_invitations" DROP CONSTRAINT "FK_9d9887246251d5e24acef860bcb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_invitations" DROP CONSTRAINT "FK_2088360151a394f86567f3798c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_memberships" DROP CONSTRAINT "FK_d22937ebccd641b5090849e51f7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_memberships" DROP CONSTRAINT "FK_7427b391abdef33b40124c15822"`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs" DROP CONSTRAINT "FK_cbffea25c132854fe6017804645"`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs" DROP CONSTRAINT "FK_a1196a1956403417fe3a0343390"`,
    );
    await queryRunner.query(
      `ALTER TABLE "webauthn_credentials" DROP CONSTRAINT "FK_4e5d1a5131f49fdbc410b8ded04"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mfa_recovery_codes" DROP CONSTRAINT "FK_1aeec4efb39bc7c382cbce99948"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" DROP CONSTRAINT "FK_e12ac4f8016243ac71fd2e415af"`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" DROP CONSTRAINT "FK_2cd545077d6e6e8378b051cf1b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" DROP CONSTRAINT "FK_6c2e267ae764a9413b863a29342"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_b25a58a00578bd1b7a01623d2dd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "webauthn_credentials" DROP CONSTRAINT "UQ_c5be2da517dc03e3fff87040bf0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "CHK_cae46de039467f3011904a5191"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "CHK_28e3764c2f42fae67c1e20bcc5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "CHK_b2902f12bf1a3f5e6d32e97eb3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "CHK_6d668d5831681657a7029ee87a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7dfa5b36a9305efc5b7e9f369a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c1d63ed5127c053e50abcdbce5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_682897ba764db30ef8836c9b74"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_807abb1f01d751e24c2a5fda8e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_be2025ac9c82bdadcf340b3dfc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4e5d1a5131f49fdbc410b8ded0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e6f17432bf91510411c796ef78"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1aeec4efb39bc7c382cbce9994"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e81c41e04269a2d2152f0d60b5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e12ac4f8016243ac71fd2e415a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e42cf55faeafdcce01a82d2484"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6c2e267ae764a9413b863a2934"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_08a22e1217e17aea515cd7ab4a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_39f8752ebc359f7595484507ca"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_50762206f116cd47d1c3fec396"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_57de40bc620f456c7311aa3a1e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_93d50353ef8c9b9b1ca2421a17"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_56b91d98f71e3d1b649ed6e9f3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4542dd2f38a61354a040ba9fd5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_610102b60fea1455310ccd299d"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mfaSecret"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "mfaSecret" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "resetToken"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "resetToken" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "phoneVerificationToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "phoneVerificationToken" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "emailVerificationToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "emailVerificationToken" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs" ALTER COLUMN "details" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ALTER COLUMN "trusted" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ALTER COLUMN "lastLogin" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ALTER COLUMN "deviceId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ADD "lastUsedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ADD "deviceName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "UQ_webauthn_user_credential" UNIQUE ("userId", "credentialId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ADD CONSTRAINT "UQ_user_device_user_deviceId" UNIQUE ("userId", "deviceId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "CHK_sessions_revoked" CHECK (((revoked = false) OR ((revoked = true) AND ("revokedAt" IS NOT NULL))))`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "CHK_sessions_expires" CHECK (("expiresAt" > "createdAt"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "CHK_refresh_tokens_revoked" CHECK ((("isRevoked" = false) OR (("isRevoked" = true) AND ("revokedAt" IS NOT NULL))))`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "CHK_refresh_tokens_expires" CHECK (("expiresAt" > "createdAt"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_system_settings_type" ON "system_settings" ("type") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_tenants_slug" ON "tenants" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tenant_invite_token" ON "tenant_invitations" ("token") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tenant_invite_email" ON "tenant_invitations" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tenant_invite_tenantId" ON "tenant_invitations" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tenant_memberships_tenant_id" ON "tenant_memberships" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tenant_memberships_user_id" ON "tenant_memberships" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_logs_timestamp" ON "logs" ("timestamp") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_logs_action" ON "logs" ("action") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_logs_tenantId" ON "logs" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_logs_userId" ON "logs" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_webauthn_credentials_credentialId" ON "webauthn_credentials" ("credentialId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_webauthn_credentials_userId" ON "webauthn_credentials" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_mfa_recovery_codes_code" ON "mfa_recovery_codes" ("code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_mfa_recovery_codes_userId" ON "mfa_recovery_codes" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_devices_deviceId" ON "user_devices" ("deviceId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_devices_userId" ON "user_devices" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_api_keys_key" ON "api_keys" ("key") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_api_keys_tenantId" ON "api_keys" ("tenantId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_api_keys_userId" ON "api_keys" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_revoked" ON "sessions" ("revoked") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_isActive" ON "sessions" ("isActive") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_expiresAt" ON "sessions" ("expiresAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_userId" ON "sessions" ("userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_refresh_tokens_token" ON "refresh_tokens" ("token") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_isRevoked" ON "refresh_tokens" ("isRevoked") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_expiresAt" ON "refresh_tokens" ("expiresAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_sessionId" ON "refresh_tokens" ("sessionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_userId" ON "refresh_tokens" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_invitations" ADD CONSTRAINT "FK_org_invite_acceptedBy" FOREIGN KEY ("acceptedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_invitations" ADD CONSTRAINT "FK_org_invite_invitedBy" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_invitations" ADD CONSTRAINT "FK_org_invite_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_memberships" ADD CONSTRAINT "FK_tenant_memberships_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_memberships" ADD CONSTRAINT "FK_tenant_memberships_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs" ADD CONSTRAINT "FK_logs_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs" ADD CONSTRAINT "FK_logs_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "FK_webauthn_credentials_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mfa_recovery_codes" ADD CONSTRAINT "FK_mfa_recovery_codes_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ADD CONSTRAINT "FK_user_devices_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" ADD CONSTRAINT "FK_api_keys_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" ADD CONSTRAINT "FK_api_keys_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
