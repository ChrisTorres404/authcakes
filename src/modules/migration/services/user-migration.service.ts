import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

export interface UserMigrationResult {
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  errors: Array<{ userId: string; error: string }>;
}

interface MigratedUser {
  accountLogin: any;
  accountUser: any;
}

@Injectable()
export class UserMigrationService {
  private readonly logger = new Logger(UserMigrationService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async migrateUsers(options: {
    batchSize: number;
    dryRun: boolean;
  }): Promise<UserMigrationResult> {
    const result: UserMigrationResult = {
      totalRecords: 0,
      processedRecords: 0,
      failedRecords: 0,
      errors: [],
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Get total count
      result.totalRecords = await this.userRepo.count();
      this.logger.log(`Starting migration of ${result.totalRecords} users`);

      // Process in batches
      let offset = 0;
      while (offset < result.totalRecords) {
        const users = await this.userRepo.find({
          skip: offset,
          take: options.batchSize,
          order: { createdAt: 'ASC' },
        });

        if (users.length === 0) break;

        if (!options.dryRun) {
          await queryRunner.startTransaction();
        }

        try {
          for (const user of users) {
            try {
              const migrated = this.transformUser(user);
              
              if (!options.dryRun) {
                await this.insertMigratedUser(queryRunner, migrated);
              }
              
              result.processedRecords++;
            } catch (error) {
              result.failedRecords++;
              result.errors.push({
                userId: user.id,
                error: error.message,
              });
              this.logger.error(`Failed to migrate user ${user.id}: ${error.message}`);
              
              if (!options.dryRun) {
                throw error; // Rollback batch
              }
            }
          }

          if (!options.dryRun) {
            await queryRunner.commitTransaction();
          }

          this.logger.log(
            `Processed batch: ${offset + users.length}/${result.totalRecords} ` +
            `(${((offset + users.length) / result.totalRecords * 100).toFixed(2)}%)`
          );
        } catch (error) {
          if (!options.dryRun) {
            await queryRunner.rollbackTransaction();
          }
          throw error;
        }

        offset += options.batchSize;
      }

      this.logger.log(
        `User migration completed. Processed: ${result.processedRecords}, Failed: ${result.failedRecords}`
      );
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  private transformUser(user: User): MigratedUser {
    return {
      accountLogin: {
        id: user.id, // Keep same ID for reference integrity
        email: user.email,
        password_hash: user.password,
        is_active: user.active,
        is_email_verified: user.emailVerified,
        is_phone_verified: user.phoneVerified || false,
        phone_number: user.phoneNumber,
        failed_login_attempts: user.failedLoginAttempts || 0,
        is_locked: user.lockedUntil ? user.lockedUntil > new Date() : false,
        is_hard_locked: false, // New field
        locked_until: user.lockedUntil,
        last_login_date: user.lastLogin,
        mfa_enabled: user.mfaEnabled || false,
        mfa_secret: user.mfaSecret,
        mfa_type: user.mfaType,
        
        // Authentication source (new in master)
        auth_source: 'local',
        auth_source_id: null,
        
        // Metrics (will be calculated from history)
        total_logins: 0,
        total_lockouts: 0,
        total_failed_logins: user.failedLoginAttempts || 0,
        
        // Temporary storage for tokens during migration
        temp_email_token: user.emailVerificationToken,
        temp_reset_token: user.resetToken,
        temp_reset_expiry: user.resetTokenExpiry,
        temp_otp: user.otp,
        temp_otp_expiry: user.otpExpiry,
        
        // Audit fields
        date_created: user.createdAt,
        date_modified: user.updatedAt,
        created_by: 'migration',
        modified_by: 'migration',
        is_deleted: false,
        deleted_by: null,
        date_deleted: null,
      },
      accountUser: {
        id: uuidv4(), // New ID for account_user
        account_login_id: user.id, // Link to login
        
        // Name fields
        first_name: user.firstName,
        last_name: user.lastName,
        middle_name: null, // New field
        prefix: null, // New field
        suffix: null, // New field
        nickname: null, // New field
        
        // Profile
        avatar_url: user.avatar,
        bio: user.bio,
        
        // Contact/Company
        company: user.company,
        department: user.department,
        job_title: null, // New field
        
        // Address
        address: user.address,
        address2: user.address2,
        city: user.city,
        state_province: user.state,
        postal_code: user.zipCode,
        country: user.country,
        
        // Preferences (new fields)
        time_zone_id: null, // Will be set to default
        culture_id: null, // Will be set to default
        date_format: null,
        time_format: null,
        
        // Audit fields
        date_created: user.createdAt,
        date_modified: user.updatedAt,
        created_by: 'migration',
        modified_by: 'migration',
        is_deleted: false,
        deleted_by: null,
        date_deleted: null,
      },
    };
  }

  private async insertMigratedUser(
    queryRunner: QueryRunner,
    migrated: MigratedUser
  ): Promise<void> {
    // Insert account_login
    const loginColumns = Object.keys(migrated.accountLogin).join(', ');
    const loginPlaceholders = Object.keys(migrated.accountLogin)
      .map((_, index) => `$${index + 1}`)
      .join(', ');
    const loginValues = Object.values(migrated.accountLogin);

    await queryRunner.query(
      `INSERT INTO account_logins (${loginColumns}) VALUES (${loginPlaceholders})`,
      loginValues
    );

    // Insert account_user
    const userColumns = Object.keys(migrated.accountUser).join(', ');
    const userPlaceholders = Object.keys(migrated.accountUser)
      .map((_, index) => `$${index + 1}`)
      .join(', ');
    const userValues = Object.values(migrated.accountUser);

    await queryRunner.query(
      `INSERT INTO account_users (${userColumns}) VALUES (${userPlaceholders})`,
      userValues
    );

    // Migrate MFA recovery codes if any
    const mfaCodes = await queryRunner.query(
      'SELECT * FROM mfa_recovery_codes WHERE "userId" = $1',
      [migrated.accountLogin.id]
    );

    for (const code of mfaCodes) {
      await queryRunner.query(
        `INSERT INTO account_login_mfa_recovery_codes 
         (id, account_login_id, code, used, used_at, date_created, date_modified, created_by, modified_by, is_deleted)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          code.id,
          migrated.accountLogin.id,
          code.code,
          code.used,
          code.usedAt,
          code.createdAt,
          code.updatedAt,
          'migration',
          'migration',
          false,
        ]
      );
    }

    // Migrate WebAuthn credentials if any
    const webauthnCreds = await queryRunner.query(
      'SELECT * FROM webauthn_credentials WHERE "userId" = $1',
      [migrated.accountLogin.id]
    );

    for (const cred of webauthnCreds) {
      await queryRunner.query(
        `INSERT INTO account_login_webauthn_credentials
         (id, account_login_id, credential_id, public_key, counter, device_name, 
          date_created, date_modified, created_by, modified_by, is_deleted)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          cred.id,
          migrated.accountLogin.id,
          cred.credentialId,
          cred.publicKey,
          cred.counter,
          cred.deviceName,
          cred.createdAt,
          cred.updatedAt,
          'migration',
          'migration',
          false,
        ]
      );
    }

    // Migrate password history
    const passwordHistory = await queryRunner.query(
      'SELECT * FROM password_history WHERE "userId" = $1 ORDER BY "createdAt" ASC',
      [migrated.accountLogin.id]
    );

    for (const history of passwordHistory) {
      await queryRunner.query(
        `INSERT INTO account_login_password_history
         (id, account_login_id, password_hash, date_created, created_by, is_deleted)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          history.id,
          migrated.accountLogin.id,
          history.passwordHash,
          history.createdAt,
          'migration',
          false,
        ]
      );
    }
  }

  async validateUserMigration(): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Check counts match
      const [userCount] = await queryRunner.query('SELECT COUNT(*) FROM users');
      const [loginCount] = await queryRunner.query('SELECT COUNT(*) FROM account_logins');
      const [accountUserCount] = await queryRunner.query('SELECT COUNT(*) FROM account_users');

      if (parseInt(userCount.count) !== parseInt(loginCount.count)) {
        errors.push(`User count mismatch: ${userCount.count} users vs ${loginCount.count} logins`);
      }

      if (parseInt(userCount.count) !== parseInt(accountUserCount.count)) {
        errors.push(`User count mismatch: ${userCount.count} users vs ${accountUserCount.count} account_users`);
      }

      // Check for orphaned account_users
      const [orphaned] = await queryRunner.query(`
        SELECT COUNT(*) FROM account_users au
        WHERE NOT EXISTS (
          SELECT 1 FROM account_logins al WHERE al.id = au.account_login_id
        )
      `);

      if (parseInt(orphaned.count) > 0) {
        errors.push(`Found ${orphaned.count} orphaned account_users`);
      }

      // Check critical fields preserved
      const criticalFieldsCheck = await queryRunner.query(`
        SELECT 
          u.id, 
          u.email, 
          al.email as login_email,
          u.password,
          al.password_hash
        FROM users u
        LEFT JOIN account_logins al ON u.id = al.id
        WHERE u.email != al.email OR u.password != al.password_hash
        LIMIT 10
      `);

      if (criticalFieldsCheck.length > 0) {
        errors.push(`Found ${criticalFieldsCheck.length} users with mismatched critical fields`);
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } finally {
      await queryRunner.release();
    }
  }
}