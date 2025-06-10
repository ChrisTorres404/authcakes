import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MigrationLog, MigrationType, MigrationStatus } from '../entities/migration-log.entity';
import { MigrationCheckpoint, CheckpointType } from '../entities/migration-checkpoint.entity';
import { UserMigrationService } from './user-migration.service';
import { TenantMigrationService } from './tenant-migration.service';
import { SecurityMigrationService } from './security-migration.service';
import { LookupDataService } from './lookup-data.service';
import { ValidationService } from './validation.service';

export interface MigrationOptions {
  batchSize?: number;
  dryRun?: boolean;
  continueOnError?: boolean;
  validateOnly?: boolean;
  types?: MigrationType[];
}

export interface MigrationResult {
  success: boolean;
  logs: MigrationLog[];
  errors: Error[];
  summary: {
    totalTime: number;
    recordsProcessed: number;
    recordsFailed: number;
    tablesAffected: string[];
  };
}

@Injectable()
export class MigrationOrchestrator {
  private readonly logger = new Logger(MigrationOrchestrator.name);
  private readonly DEFAULT_BATCH_SIZE = 1000;

  constructor(
    @InjectRepository(MigrationLog)
    private migrationLogRepo: Repository<MigrationLog>,
    @InjectRepository(MigrationCheckpoint)
    private checkpointRepo: Repository<MigrationCheckpoint>,
    private dataSource: DataSource,
    private userMigration: UserMigrationService,
    private tenantMigration: TenantMigrationService,
    private securityMigration: SecurityMigrationService,
    private lookupData: LookupDataService,
    private validation: ValidationService,
  ) {}

  async migrate(options: MigrationOptions = {}): Promise<MigrationResult> {
    const startTime = Date.now();
    const logs: MigrationLog[] = [];
    const errors: Error[] = [];
    const result: MigrationResult = {
      success: false,
      logs,
      errors,
      summary: {
        totalTime: 0,
        recordsProcessed: 0,
        recordsFailed: 0,
        tablesAffected: [],
      },
    };

    try {
      this.logger.log('Starting database migration...');
      
      // Step 1: Pre-migration validation
      if (!options.validateOnly) {
        const validationResult = await this.validation.validatePreMigration();
        if (!validationResult.isValid) {
          throw new Error(`Pre-migration validation failed: ${validationResult.errors.join(', ')}`);
        }
      }

      // Step 2: Create initial checkpoint
      const initialCheckpoint = await this.createCheckpoint(CheckpointType.PRE_MIGRATION);
      this.logger.log(`Created checkpoint: ${initialCheckpoint.id}`);

      // Step 3: Setup lookup data (required for foreign keys)
      if (this.shouldMigrate(MigrationType.LOOKUP_DATA, options)) {
        const lookupLog = await this.executeMigration(
          MigrationType.LOOKUP_DATA,
          () => this.lookupData.setupLookupData(),
          options
        );
        logs.push(lookupLog);
        await this.createCheckpoint(CheckpointType.POST_LOOKUP);
      }

      // Step 4: Migrate users (most complex, do first)
      if (this.shouldMigrate(MigrationType.USERS, options)) {
        const userLog = await this.executeMigration(
          MigrationType.USERS,
          () => this.userMigration.migrateUsers({
            batchSize: options.batchSize || this.DEFAULT_BATCH_SIZE,
            dryRun: options.dryRun || false,
          }),
          options
        );
        logs.push(userLog);
        await this.createCheckpoint(CheckpointType.POST_USERS);
        result.summary.tablesAffected.push('account_logins', 'account_users');
      }

      // Step 5: Migrate tenants to accounts
      if (this.shouldMigrate(MigrationType.TENANTS, options)) {
        const tenantLog = await this.executeMigration(
          MigrationType.TENANTS,
          () => this.tenantMigration.migrateTenants({
            batchSize: options.batchSize || this.DEFAULT_BATCH_SIZE,
            dryRun: options.dryRun || false,
          }),
          options
        );
        logs.push(tenantLog);
        await this.createCheckpoint(CheckpointType.POST_TENANTS);
        result.summary.tablesAffected.push('accounts');
      }

      // Step 6: Setup security (groups, privileges)
      if (this.shouldMigrate(MigrationType.SECURITY, options)) {
        const securityLog = await this.executeMigration(
          MigrationType.SECURITY,
          () => this.securityMigration.setupSecurity({
            dryRun: options.dryRun || false,
          }),
          options
        );
        logs.push(securityLog);
        await this.createCheckpoint(CheckpointType.POST_SECURITY);
        result.summary.tablesAffected.push(
          'security_privileges',
          'security_policy_groups',
          'account_management_groups'
        );
      }

      // Step 7: Final validation
      if (!options.dryRun && !options.validateOnly) {
        const finalValidation = await this.validation.validatePostMigration();
        if (!finalValidation.isValid) {
          this.logger.warn(`Post-migration validation warnings: ${finalValidation.warnings.join(', ')}`);
        }
      }

      // Step 8: Create final checkpoint
      const finalCheckpoint = await this.createCheckpoint(CheckpointType.FINAL);
      this.logger.log(`Migration completed successfully. Final checkpoint: ${finalCheckpoint.id}`);

      result.success = true;
    } catch (error) {
      this.logger.error(`Migration failed: ${error.message}`, error.stack);
      errors.push(error);
      result.success = false;
      
      if (!options.continueOnError) {
        throw error;
      }
    } finally {
      // Calculate summary
      result.summary.totalTime = Math.floor((Date.now() - startTime) / 1000);
      result.summary.recordsProcessed = logs.reduce((sum, log) => sum + log.processedRecords, 0);
      result.summary.recordsFailed = logs.reduce((sum, log) => sum + log.failedRecords, 0);
    }

    return result;
  }

  private shouldMigrate(type: MigrationType, options: MigrationOptions): boolean {
    if (!options.types || options.types.length === 0) {
      return true; // Migrate all if no specific types specified
    }
    return options.types.includes(type) || options.types.includes(MigrationType.FULL);
  }

  private async executeMigration(
    type: MigrationType,
    migrationFn: () => Promise<any>,
    options: MigrationOptions
  ): Promise<MigrationLog> {
    const log = new MigrationLog();
    log.type = type;
    log.executedBy = 'system';
    log.metadata = { options };

    try {
      log.markInProgress();
      await this.migrationLogRepo.save(log);

      this.logger.log(`Starting ${type} migration...`);
      const result = await migrationFn();

      log.totalRecords = result.totalRecords || 0;
      log.processedRecords = result.processedRecords || 0;
      log.failedRecords = result.failedRecords || 0;
      log.metadata = { ...log.metadata, result };
      log.markCompleted();

      this.logger.log(`Completed ${type} migration. Success rate: ${log.getSuccessRate().toFixed(2)}%`);
    } catch (error) {
      log.markFailed(error);
      this.logger.error(`Failed ${type} migration: ${error.message}`);
      
      if (!options.continueOnError) {
        throw error;
      }
    } finally {
      await this.migrationLogRepo.save(log);
    }

    return log;
  }

  private async createCheckpoint(type: CheckpointType): Promise<MigrationCheckpoint> {
    const counts = await this.getCurrentCounts();
    const checkpoint = MigrationCheckpoint.createCheckpoint(
      type,
      { counts, lastProcessedIds: {}, checksums: {} },
      'system',
      `Checkpoint after ${type}`
    );

    // Deactivate previous checkpoints of the same type
    await this.checkpointRepo.update(
      { type, isActive: true },
      { isActive: false }
    );

    return this.checkpointRepo.save(checkpoint);
  }

  private async getCurrentCounts(): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const counts = {
        // Current schema
        users: await queryRunner.query('SELECT COUNT(*) FROM users'),
        tenants: await queryRunner.query('SELECT COUNT(*) FROM tenants'),
        tenant_memberships: await queryRunner.query('SELECT COUNT(*) FROM tenant_memberships'),
        sessions: await queryRunner.query('SELECT COUNT(*) FROM sessions'),
        api_keys: await queryRunner.query('SELECT COUNT(*) FROM api_keys'),
        system_settings: await queryRunner.query('SELECT COUNT(*) FROM system_settings'),
      };

      // Check if master tables exist
      const masterTables = [
        'account_logins',
        'account_users',
        'accounts',
        'account_management_groups',
        'account_management_group_members',
      ];

      for (const table of masterTables) {
        try {
          const result = await queryRunner.query(`SELECT COUNT(*) FROM ${table}`);
          counts[table] = parseInt(result[0].count);
        } catch (error) {
          // Table doesn't exist yet
          counts[table] = 0;
        }
      }

      return counts;
    } finally {
      await queryRunner.release();
    }
  }

  async getMigrationStatus(): Promise<{
    lastMigration: MigrationLog | null;
    activeCheckpoint: MigrationCheckpoint | null;
    pendingMigrations: MigrationType[];
  }> {
    const lastMigration = await this.migrationLogRepo.findOne({
      order: { startedAt: 'DESC' },
    });

    const activeCheckpoint = await this.checkpointRepo.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    const completedTypes = await this.migrationLogRepo
      .createQueryBuilder('log')
      .select('DISTINCT log.type')
      .where('log.status = :status', { status: MigrationStatus.COMPLETED })
      .getRawMany();

    const allTypes = Object.values(MigrationType).filter(t => t !== MigrationType.FULL);
    const pendingMigrations = allTypes.filter(
      type => !completedTypes.find(ct => ct.type === type)
    );

    return { lastMigration, activeCheckpoint, pendingMigrations };
  }
}