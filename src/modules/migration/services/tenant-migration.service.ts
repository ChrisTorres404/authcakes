import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantMembership } from '../../tenants/entities/tenant-membership.entity';
import { v4 as uuidv4 } from 'uuid';

export interface TenantMigrationResult {
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  errors: Array<{ tenantId: string; error: string }>;
}

@Injectable()
export class TenantMigrationService {
  private readonly logger = new Logger(TenantMigrationService.name);
  
  // Default IDs for lookup data (should match what LookupDataService creates)
  private readonly DEFAULTS = {
    accountStatusId: 'default-active-status',
    accountTypeId: 'default-standard-type',
    tenantTypeId: 'default-organization-type',
    cultureId: 'default-en-us',
    timeZoneId: 'default-utc',
  };

  constructor(
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
    @InjectRepository(TenantMembership)
    private membershipRepo: Repository<TenantMembership>,
    private dataSource: DataSource,
  ) {}

  async migrateTenants(options: {
    batchSize: number;
    dryRun: boolean;
  }): Promise<TenantMigrationResult> {
    const result: TenantMigrationResult = {
      totalRecords: 0,
      processedRecords: 0,
      failedRecords: 0,
      errors: [],
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Get total count
      result.totalRecords = await this.tenantRepo.count();
      this.logger.log(`Starting migration of ${result.totalRecords} tenants`);

      // Get default IDs from actual database
      if (!options.dryRun) {
        await this.loadDefaultIds(queryRunner);
      }

      // Process in batches
      let offset = 0;
      while (offset < result.totalRecords) {
        const tenants = await this.tenantRepo.find({
          skip: offset,
          take: options.batchSize,
          order: { createdAt: 'ASC' },
        });

        if (tenants.length === 0) break;

        if (!options.dryRun) {
          await queryRunner.startTransaction();
        }

        try {
          for (const tenant of tenants) {
            try {
              const account = await this.transformTenant(tenant, queryRunner);
              
              if (!options.dryRun) {
                await this.insertAccount(queryRunner, account);
                await this.createDefaultGroups(queryRunner, tenant.id);
                await this.migrateMemberships(queryRunner, tenant.id);
              }
              
              result.processedRecords++;
            } catch (error) {
              result.failedRecords++;
              result.errors.push({
                tenantId: tenant.id,
                error: error.message,
              });
              this.logger.error(`Failed to migrate tenant ${tenant.id}: ${error.message}`);
              
              if (!options.dryRun) {
                throw error; // Rollback batch
              }
            }
          }

          if (!options.dryRun) {
            await queryRunner.commitTransaction();
          }

          this.logger.log(
            `Processed batch: ${offset + tenants.length}/${result.totalRecords} ` +
            `(${((offset + tenants.length) / result.totalRecords * 100).toFixed(2)}%)`
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
        `Tenant migration completed. Processed: ${result.processedRecords}, Failed: ${result.failedRecords}`
      );
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  private async loadDefaultIds(queryRunner: QueryRunner): Promise<void> {
    try {
      // Load actual IDs from lookup tables
      const [status] = await queryRunner.query(
        `SELECT id FROM account_status WHERE name = 'Active' LIMIT 1`
      );
      if (status) this.DEFAULTS.accountStatusId = status.id;

      const [accountType] = await queryRunner.query(
        `SELECT id FROM account_types WHERE code = 'STD' LIMIT 1`
      );
      if (accountType) this.DEFAULTS.accountTypeId = accountType.id;

      const [tenantType] = await queryRunner.query(
        `SELECT id FROM tenant_types WHERE name = 'Organization' LIMIT 1`
      );
      if (tenantType) this.DEFAULTS.tenantTypeId = tenantType.id;

      const [culture] = await queryRunner.query(
        `SELECT id FROM system_cultures WHERE code = 'en-US' LIMIT 1`
      );
      if (culture) this.DEFAULTS.cultureId = culture.id;

      const [timezone] = await queryRunner.query(
        `SELECT id FROM system_time_zones WHERE iana_id = 'UTC' LIMIT 1`
      );
      if (timezone) this.DEFAULTS.timeZoneId = timezone.id;
    } catch (error) {
      this.logger.warn('Failed to load some default IDs, using fallbacks');
    }
  }

  private async transformTenant(tenant: Tenant, queryRunner: QueryRunner): Promise<any> {
    // Parse settings JSON
    let settings = {};
    try {
      settings = tenant.settings || {};
    } catch (error) {
      this.logger.warn(`Failed to parse settings for tenant ${tenant.id}`);
    }

    // Get primary admin email for account email
    let primaryEmail = null;
    try {
      const [admin] = await queryRunner.query(
        `SELECT u.email FROM users u
         JOIN tenant_memberships tm ON tm.user_id = u.id
         WHERE tm.tenant_id = $1 AND tm.role = 'admin'
         ORDER BY tm."createdAt" ASC
         LIMIT 1`,
        [tenant.id]
      );
      if (admin) primaryEmail = admin.email;
    } catch (error) {
      this.logger.warn(`Failed to get admin email for tenant ${tenant.id}`);
    }

    return {
      // Direct mappings
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.slug,
      logo_url: tenant.logo,
      is_active: tenant.active,
      
      // New required fields with defaults
      account_status_id: this.DEFAULTS.accountStatusId,
      account_type_id: this.DEFAULTS.accountTypeId,
      tenant_type_id: this.DEFAULTS.tenantTypeId,
      friendly_name: tenant.name,
      legal_name: tenant.name, // Should be updated post-migration
      tax_id: null,
      date_established: tenant.createdAt,
      
      // Contact information
      email: primaryEmail,
      phone: settings.phone || null,
      fax: null,
      website: settings.website || null,
      
      // Address (from settings if available)
      address: settings.address || null,
      address2: null,
      city: settings.city || null,
      state_province: settings.state || null,
      postal_code: settings.postalCode || null,
      country: settings.country || null,
      
      // Features and limits
      database_connection_string: null, // For future multi-db support
      storage_connection_string: null,
      max_users: 0, // 0 = unlimited
      max_storage_gb: 0, // 0 = unlimited
      
      // Branding
      theme_primary_color: settings.theme?.primaryColor || '#1890ff',
      theme_secondary_color: settings.theme?.secondaryColor || '#52c41a',
      theme_logo_url: tenant.logo,
      custom_css: settings.customCss || null,
      favicon_url: settings.faviconUrl || null,
      
      // Localization
      default_culture_id: this.DEFAULTS.cultureId,
      default_time_zone_id: this.DEFAULTS.timeZoneId,
      
      // Additional settings
      settings_json: JSON.stringify(settings),
      
      // Audit fields
      date_created: tenant.createdAt,
      date_modified: tenant.updatedAt,
      created_by: 'migration',
      modified_by: 'migration',
      is_deleted: tenant.deletedAt !== null,
      deleted_by: tenant.deletedAt ? 'unknown' : null,
      date_deleted: tenant.deletedAt,
    };
  }

  private async insertAccount(queryRunner: QueryRunner, account: any): Promise<void> {
    const columns = Object.keys(account).join(', ');
    const placeholders = Object.keys(account)
      .map((_, index) => `$${index + 1}`)
      .join(', ');
    const values = Object.values(account);

    await queryRunner.query(
      `INSERT INTO accounts (${columns}) VALUES (${placeholders})`,
      values
    );

    // Create default account settings
    await queryRunner.query(
      `INSERT INTO account_settings 
       (id, account_id, key, value, data_type, is_encrypted, date_created, created_by, is_deleted)
       VALUES 
       ($1, $2, 'migration.source', 'authcakes-v1', 'string', false, NOW(), 'migration', false),
       ($2, $2, 'migration.date', $3, 'datetime', false, NOW(), 'migration', false)`,
      [uuidv4(), account.id, new Date().toISOString()]
    );
  }

  private async createDefaultGroups(queryRunner: QueryRunner, accountId: string): Promise<void> {
    // Create default management groups
    const groups = [
      {
        id: uuidv4(),
        account_id: accountId,
        name: 'Administrators',
        description: 'Full administrative access',
        is_system: true,
      },
      {
        id: uuidv4(),
        account_id: accountId,
        name: 'Members',
        description: 'Standard member access',
        is_system: true,
      },
    ];

    for (const group of groups) {
      await queryRunner.query(
        `INSERT INTO account_management_groups 
         (id, account_id, name, description, is_system, date_created, created_by, is_deleted)
         VALUES ($1, $2, $3, $4, $5, NOW(), 'migration', false)`,
        [group.id, group.account_id, group.name, group.description, group.is_system]
      );

      // Store group IDs for membership migration
      await queryRunner.query(
        `INSERT INTO migration_metadata 
         (key, value, created_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2`,
        [`group_${accountId}_${group.name.toLowerCase()}`, group.id]
      );
    }
  }

  private async migrateMemberships(queryRunner: QueryRunner, tenantId: string): Promise<void> {
    // Get all memberships for this tenant
    const memberships = await queryRunner.query(
      `SELECT tm.*, au.id as account_user_id
       FROM tenant_memberships tm
       JOIN account_users au ON au.account_login_id = tm.user_id
       WHERE tm.tenant_id = $1 AND tm."deletedAt" IS NULL`,
      [tenantId]
    );

    for (const membership of memberships) {
      // Get the appropriate group ID
      const groupName = membership.role === 'admin' ? 'administrators' : 'members';
      const [groupData] = await queryRunner.query(
        `SELECT value FROM migration_metadata WHERE key = $1`,
        [`group_${tenantId}_${groupName}`]
      );

      if (!groupData) {
        this.logger.error(`Failed to find group for ${tenantId}/${groupName}`);
        continue;
      }

      const groupId = groupData.value;

      // Create group membership
      await queryRunner.query(
        `INSERT INTO account_management_group_members
         (id, account_management_group_id, account_user_id, 
          date_created, date_modified, created_by, modified_by, is_deleted)
         VALUES ($1, $2, $3, $4, $5, 'migration', 'migration', false)`,
        [
          uuidv4(),
          groupId,
          membership.account_user_id,
          membership.createdAt,
          membership.updatedAt,
        ]
      );
    }

    // Assign privileges to groups (handled by SecurityMigrationService)
  }

  async validateTenantMigration(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Check counts match
      const [tenantCount] = await queryRunner.query('SELECT COUNT(*) FROM tenants WHERE "deletedAt" IS NULL');
      const [accountCount] = await queryRunner.query('SELECT COUNT(*) FROM accounts WHERE is_deleted = false');

      if (parseInt(tenantCount.count) !== parseInt(accountCount.count)) {
        errors.push(`Tenant count mismatch: ${tenantCount.count} tenants vs ${accountCount.count} accounts`);
      }

      // Check all tenants have groups
      const [missingGroups] = await queryRunner.query(`
        SELECT COUNT(DISTINCT a.id) 
        FROM accounts a
        WHERE NOT EXISTS (
          SELECT 1 FROM account_management_groups amg 
          WHERE amg.account_id = a.id
        ) AND a.is_deleted = false
      `);

      if (parseInt(missingGroups.count) > 0) {
        errors.push(`Found ${missingGroups.count} accounts without management groups`);
      }

      // Check membership migration
      const [membershipCount] = await queryRunner.query(
        'SELECT COUNT(*) FROM tenant_memberships WHERE "deletedAt" IS NULL'
      );
      const [groupMemberCount] = await queryRunner.query(
        'SELECT COUNT(*) FROM account_management_group_members WHERE is_deleted = false'
      );

      if (parseInt(membershipCount.count) !== parseInt(groupMemberCount.count)) {
        warnings.push(
          `Membership count mismatch: ${membershipCount.count} tenant_memberships vs ` +
          `${groupMemberCount.count} group_members (some users may not have been migrated yet)`
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } finally {
      await queryRunner.release();
    }
  }
}