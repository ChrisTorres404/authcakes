import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { MigrationCheckpoint, CheckpointType } from '../entities/migration-checkpoint.entity';
import { MigrationLog, MigrationStatus } from '../entities/migration-log.entity';

export interface RollbackResult {
  success: boolean;
  checkpointId: string;
  tablesAffected: string[];
  recordsRestored: number;
  errors: string[];
}

@Injectable()
export class RollbackService {
  private readonly logger = new Logger(RollbackService.name);

  constructor(
    @InjectRepository(MigrationCheckpoint)
    private checkpointRepo: Repository<MigrationCheckpoint>,
    @InjectRepository(MigrationLog)
    private migrationLogRepo: Repository<MigrationLog>,
    private dataSource: DataSource,
  ) {}

  async rollbackToCheckpoint(checkpointId: string): Promise<RollbackResult> {
    const result: RollbackResult = {
      success: false,
      checkpointId,
      tablesAffected: [],
      recordsRestored: 0,
      errors: [],
    };

    const checkpoint = await this.checkpointRepo.findOne({
      where: { id: checkpointId, isActive: true },
    });

    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found or is not active`);
    }

    this.logger.log(`Starting rollback to checkpoint: ${checkpoint.type} (${checkpoint.id})`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      switch (checkpoint.type) {
        case CheckpointType.PRE_MIGRATION:
          await this.rollbackToPreMigration(queryRunner, result);
          break;
        
        case CheckpointType.POST_LOOKUP:
          await this.rollbackLookupData(queryRunner, result);
          break;
        
        case CheckpointType.POST_USERS:
          await this.rollbackUsers(queryRunner, result);
          break;
        
        case CheckpointType.POST_TENANTS:
          await this.rollbackTenants(queryRunner, result);
          break;
        
        case CheckpointType.POST_SECURITY:
          await this.rollbackSecurity(queryRunner, result);
          break;
        
        default:
          throw new Error(`Rollback not implemented for checkpoint type: ${checkpoint.type}`);
      }

      // Update migration logs
      await this.updateMigrationLogs(checkpoint.type);

      await queryRunner.commitTransaction();
      result.success = true;

      this.logger.log(
        `Rollback completed successfully. Tables affected: ${result.tablesAffected.length}, ` +
        `Records restored: ${result.recordsRestored}`
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      result.errors.push(error.message);
      this.logger.error(`Rollback failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  private async rollbackToPreMigration(
    queryRunner: QueryRunner,
    result: RollbackResult
  ): Promise<void> {
    this.logger.log('Rolling back to pre-migration state...');

    // Drop all master schema tables
    const masterTables = [
      // Drop in reverse dependency order
      'security_privilege_routes',
      'account_management_group_privileges',
      'security_policy_group_permissions',
      'security_policy_group_access',
      'security_policy_groups',
      'security_privileges',
      'account_management_group_members',
      'account_management_groups',
      'account_login_password_history',
      'account_login_webauthn_credentials',
      'account_login_mfa_recovery_codes',
      'account_module_subscription_history',
      'account_module_subscriptions',
      'account_package_subscriptions',
      'account_phone_numbers',
      'account_addresses',
      'account_contacts',
      'account_notes',
      'account_activation_history',
      'account_login_history',
      'account_users',
      'account_logins',
      'account_settings',
      'account_formats',
      'accounts',
      // Lookup tables
      'system_module_license_types',
      'system_master_organization_types',
      'system_address_types',
      'system_phone_types',
      'system_countries',
      'system_time_zones',
      'system_cultures',
      'tenant_types',
      'account_types',
      'account_status',
      // Temp tables
      'migration_metadata',
    ];

    for (const table of masterTables) {
      try {
        await queryRunner.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        result.tablesAffected.push(table);
        this.logger.debug(`Dropped table: ${table}`);
      } catch (error) {
        result.errors.push(`Failed to drop ${table}: ${error.message}`);
      }
    }

    // Reset any modified original tables
    await this.resetOriginalTables(queryRunner, result);
  }

  private async rollbackLookupData(
    queryRunner: QueryRunner,
    result: RollbackResult
  ): Promise<void> {
    this.logger.log('Rolling back lookup data...');

    const lookupTables = [
      'system_module_license_types',
      'system_master_organization_types',
      'system_address_types',
      'system_phone_types',
      'system_countries',
      'system_time_zones',
      'system_cultures',
      'tenant_types',
      'account_types',
      'account_status',
      'migration_metadata',
    ];

    for (const table of lookupTables) {
      try {
        const deleted = await queryRunner.query(`DELETE FROM ${table}`);
        result.tablesAffected.push(table);
        result.recordsRestored += deleted.rowCount || 0;
      } catch (error) {
        result.errors.push(`Failed to clear ${table}: ${error.message}`);
      }
    }
  }

  private async rollbackUsers(
    queryRunner: QueryRunner,
    result: RollbackResult
  ): Promise<void> {
    this.logger.log('Rolling back user migration...');

    // Delete migrated user data
    const tables = [
      'account_login_password_history',
      'account_login_webauthn_credentials',
      'account_login_mfa_recovery_codes',
      'account_users',
      'account_logins',
    ];

    for (const table of tables) {
      try {
        const deleted = await queryRunner.query(`DELETE FROM ${table}`);
        result.tablesAffected.push(table);
        result.recordsRestored += deleted.rowCount || 0;
      } catch (error) {
        result.errors.push(`Failed to clear ${table}: ${error.message}`);
      }
    }

    // Restore any modified flags on original users table
    await queryRunner.query(`
      UPDATE users 
      SET "lockedUntil" = NULL 
      WHERE "lockedUntil" IS NOT NULL 
        AND "lockedUntil" < NOW()
    `);
  }

  private async rollbackTenants(
    queryRunner: QueryRunner,
    result: RollbackResult
  ): Promise<void> {
    this.logger.log('Rolling back tenant migration...');

    // Delete in dependency order
    const tables = [
      'account_management_group_members',
      'account_management_groups',
      'account_settings',
      'accounts',
    ];

    for (const table of tables) {
      try {
        const deleted = await queryRunner.query(`DELETE FROM ${table}`);
        result.tablesAffected.push(table);
        result.recordsRestored += deleted.rowCount || 0;
      } catch (error) {
        result.errors.push(`Failed to clear ${table}: ${error.message}`);
      }
    }
  }

  private async rollbackSecurity(
    queryRunner: QueryRunner,
    result: RollbackResult
  ): Promise<void> {
    this.logger.log('Rolling back security setup...');

    const tables = [
      'security_privilege_routes',
      'account_management_group_privileges',
      'security_policy_group_permissions',
      'security_policy_group_access',
      'security_policy_groups',
      'security_privileges',
    ];

    for (const table of tables) {
      try {
        const deleted = await queryRunner.query(`DELETE FROM ${table}`);
        result.tablesAffected.push(table);
        result.recordsRestored += deleted.rowCount || 0;
      } catch (error) {
        result.errors.push(`Failed to clear ${table}: ${error.message}`);
      }
    }
  }

  private async resetOriginalTables(
    queryRunner: QueryRunner,
    result: RollbackResult
  ): Promise<void> {
    // Reset any flags or temporary columns added during migration
    const resetQueries = [
      `ALTER TABLE users DROP COLUMN IF EXISTS migration_processed`,
      `ALTER TABLE tenants DROP COLUMN IF EXISTS migration_processed`,
      `ALTER TABLE api_keys DROP COLUMN IF EXISTS migration_processed`,
    ];

    for (const query of resetQueries) {
      try {
        await queryRunner.query(query);
      } catch (error) {
        // Column might not exist, which is fine
        this.logger.debug(`Reset query failed (expected): ${error.message}`);
      }
    }
  }

  private async updateMigrationLogs(checkpointType: CheckpointType): Promise<void> {
    // Mark all migrations after this checkpoint as rolled back
    const typesToRollback = this.getMigrationTypesAfterCheckpoint(checkpointType);

    for (const type of typesToRollback) {
      await this.migrationLogRepo.update(
        { type, status: MigrationStatus.COMPLETED },
        { status: MigrationStatus.ROLLED_BACK }
      );
    }
  }

  private getMigrationTypesAfterCheckpoint(checkpointType: CheckpointType): string[] {
    const checkpointOrder = {
      [CheckpointType.PRE_MIGRATION]: [],
      [CheckpointType.POST_LOOKUP]: ['USERS', 'TENANTS', 'SECURITY'],
      [CheckpointType.POST_USERS]: ['TENANTS', 'SECURITY'],
      [CheckpointType.POST_TENANTS]: ['SECURITY'],
      [CheckpointType.POST_SECURITY]: [],
      [CheckpointType.FINAL]: [],
    };

    return checkpointOrder[checkpointType] || [];
  }

  async listCheckpoints(): Promise<MigrationCheckpoint[]> {
    return this.checkpointRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async createManualCheckpoint(
    description: string,
    createdBy: string
  ): Promise<MigrationCheckpoint> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Gather current state
      const counts = await this.gatherCurrentCounts(queryRunner);
      
      const checkpoint = MigrationCheckpoint.createCheckpoint(
        CheckpointType.FINAL, // Use FINAL for manual checkpoints
        { counts, lastProcessedIds: {}, checksums: {} },
        createdBy,
        description
      );

      return this.checkpointRepo.save(checkpoint);
    } finally {
      await queryRunner.release();
    }
  }

  private async gatherCurrentCounts(queryRunner: QueryRunner): Promise<any> {
    const counts: any = {};
    
    // Current schema tables
    const currentTables = [
      'users', 'tenants', 'tenant_memberships', 
      'sessions', 'api_keys', 'system_settings'
    ];

    for (const table of currentTables) {
      try {
        const [result] = await queryRunner.query(`SELECT COUNT(*) FROM ${table}`);
        counts[table] = parseInt(result.count);
      } catch (error) {
        counts[table] = 0;
      }
    }

    // Master schema tables
    const masterTables = [
      'account_logins', 'account_users', 'accounts',
      'account_management_groups', 'account_management_group_members'
    ];

    for (const table of masterTables) {
      try {
        const [result] = await queryRunner.query(`SELECT COUNT(*) FROM ${table}`);
        counts[table] = parseInt(result.count);
      } catch (error) {
        counts[table] = 0;
      }
    }

    return counts;
  }
}