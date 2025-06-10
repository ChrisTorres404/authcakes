import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export interface LookupDataResult {
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  tables: string[];
}

@Injectable()
export class LookupDataService {
  private readonly logger = new Logger(LookupDataService.name);

  constructor(private dataSource: DataSource) {}

  async setupLookupData(): Promise<LookupDataResult> {
    const result: LookupDataResult = {
      totalRecords: 0,
      processedRecords: 0,
      failedRecords: 0,
      tables: [],
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      // Create tables in dependency order
      await this.createAccountStatuses(queryRunner);
      result.tables.push('account_status');

      await this.createAccountTypes(queryRunner);
      result.tables.push('account_types');

      await this.createTenantTypes(queryRunner);
      result.tables.push('tenant_types');

      await this.createSystemCultures(queryRunner);
      result.tables.push('system_cultures');

      await this.createSystemTimeZones(queryRunner);
      result.tables.push('system_time_zones');

      await this.createSystemCountries(queryRunner);
      result.tables.push('system_countries');

      await this.createSystemPhoneTypes(queryRunner);
      result.tables.push('system_phone_types');

      await this.createSystemAddressTypes(queryRunner);
      result.tables.push('system_address_types');

      await this.createMasterOrganizationTypes(queryRunner);
      result.tables.push('system_master_organization_types');

      await this.createModuleLicenseTypes(queryRunner);
      result.tables.push('system_module_license_types');

      await this.createMigrationMetadataTable(queryRunner);
      result.tables.push('migration_metadata');

      await queryRunner.commitTransaction();

      // Count all records created
      for (const table of result.tables) {
        try {
          const [count] = await queryRunner.query(`SELECT COUNT(*) FROM ${table}`);
          result.totalRecords += parseInt(count.count);
        } catch (error) {
          // Table might not exist in some cases
        }
      }

      result.processedRecords = result.totalRecords;
      this.logger.log(`Lookup data setup completed. Created ${result.totalRecords} records in ${result.tables.length} tables`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  private async createAccountStatuses(queryRunner: QueryRunner): Promise<void> {
    const statuses = [
      { id: 'default-active-status', name: 'Active', can_login: true, is_default: true },
      { id: uuidv4(), name: 'Suspended', can_login: false, is_default: false },
      { id: uuidv4(), name: 'Pending', can_login: false, is_default: false },
      { id: uuidv4(), name: 'Closed', can_login: false, is_default: false },
    ];

    for (const status of statuses) {
      await queryRunner.query(
        `INSERT INTO account_status 
         (id, name, description, can_login, is_default, sort_order, 
          date_created, created_by, is_deleted)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'migration', false)
         ON CONFLICT (name) DO NOTHING`,
        [
          status.id,
          status.name,
          `${status.name} account status`,
          status.can_login,
          status.is_default,
          statuses.indexOf(status) + 1,
        ]
      );
    }
  }

  private async createAccountTypes(queryRunner: QueryRunner): Promise<void> {
    const types = [
      { id: 'default-standard-type', name: 'Standard', code: 'STD' },
      { id: uuidv4(), name: 'Premium', code: 'PRM' },
      { id: uuidv4(), name: 'Enterprise', code: 'ENT' },
      { id: uuidv4(), name: 'Trial', code: 'TRL' },
    ];

    for (const type of types) {
      await queryRunner.query(
        `INSERT INTO account_types
         (id, name, code, description, is_active,
          date_created, created_by, is_deleted)
         VALUES ($1, $2, $3, $4, true, NOW(), 'migration', false)
         ON CONFLICT (code) DO NOTHING`,
        [
          type.id,
          type.name,
          type.code,
          `${type.name} account type`,
        ]
      );
    }
  }

  private async createTenantTypes(queryRunner: QueryRunner): Promise<void> {
    const types = [
      { id: 'default-organization-type', name: 'Organization' },
      { id: uuidv4(), name: 'Individual' },
      { id: uuidv4(), name: 'Team' },
      { id: uuidv4(), name: 'Department' },
    ];

    for (const type of types) {
      await queryRunner.query(
        `INSERT INTO tenant_types
         (id, name, description, is_active,
          date_created, created_by, is_deleted)
         VALUES ($1, $2, $3, true, NOW(), 'migration', false)
         ON CONFLICT (name) DO NOTHING`,
        [
          type.id,
          type.name,
          `${type.name} tenant type`,
        ]
      );
    }
  }

  private async createSystemCultures(queryRunner: QueryRunner): Promise<void> {
    const cultures = [
      { id: 'default-en-us', code: 'en-US', name: 'English (United States)', native_name: 'English' },
      { id: uuidv4(), code: 'en-GB', name: 'English (United Kingdom)', native_name: 'English' },
      { id: uuidv4(), code: 'es-ES', name: 'Spanish (Spain)', native_name: 'Español' },
      { id: uuidv4(), code: 'fr-FR', name: 'French (France)', native_name: 'Français' },
      { id: uuidv4(), code: 'de-DE', name: 'German (Germany)', native_name: 'Deutsch' },
      { id: uuidv4(), code: 'pt-BR', name: 'Portuguese (Brazil)', native_name: 'Português' },
      { id: uuidv4(), code: 'ja-JP', name: 'Japanese (Japan)', native_name: '日本語' },
      { id: uuidv4(), code: 'zh-CN', name: 'Chinese (Simplified)', native_name: '简体中文' },
    ];

    for (const culture of cultures) {
      await queryRunner.query(
        `INSERT INTO system_cultures
         (id, code, name, native_name, is_active,
          date_created, created_by, is_deleted)
         VALUES ($1, $2, $3, $4, true, NOW(), 'migration', false)
         ON CONFLICT (code) DO NOTHING`,
        [culture.id, culture.code, culture.name, culture.native_name]
      );
    }
  }

  private async createSystemTimeZones(queryRunner: QueryRunner): Promise<void> {
    const timeZones = [
      { id: 'default-utc', iana_id: 'UTC', name: 'Coordinated Universal Time', abbreviation: 'UTC', offset: '+00:00' },
      { id: uuidv4(), iana_id: 'America/New_York', name: 'Eastern Time', abbreviation: 'EST/EDT', offset: '-05:00' },
      { id: uuidv4(), iana_id: 'America/Chicago', name: 'Central Time', abbreviation: 'CST/CDT', offset: '-06:00' },
      { id: uuidv4(), iana_id: 'America/Denver', name: 'Mountain Time', abbreviation: 'MST/MDT', offset: '-07:00' },
      { id: uuidv4(), iana_id: 'America/Los_Angeles', name: 'Pacific Time', abbreviation: 'PST/PDT', offset: '-08:00' },
      { id: uuidv4(), iana_id: 'Europe/London', name: 'British Time', abbreviation: 'GMT/BST', offset: '+00:00' },
      { id: uuidv4(), iana_id: 'Europe/Paris', name: 'Central European Time', abbreviation: 'CET/CEST', offset: '+01:00' },
      { id: uuidv4(), iana_id: 'Asia/Tokyo', name: 'Japan Standard Time', abbreviation: 'JST', offset: '+09:00' },
      { id: uuidv4(), iana_id: 'Australia/Sydney', name: 'Australian Eastern Time', abbreviation: 'AEST/AEDT', offset: '+10:00' },
    ];

    for (const tz of timeZones) {
      await queryRunner.query(
        `INSERT INTO system_time_zones
         (id, iana_id, name, abbreviation, utc_offset, is_active,
          date_created, created_by, is_deleted)
         VALUES ($1, $2, $3, $4, $5, true, NOW(), 'migration', false)
         ON CONFLICT (iana_id) DO NOTHING`,
        [tz.id, tz.iana_id, tz.name, tz.abbreviation, tz.offset]
      );
    }
  }

  private async createSystemCountries(queryRunner: QueryRunner): Promise<void> {
    const countries = [
      { code: 'US', name: 'United States', iso3: 'USA', numeric: '840' },
      { code: 'CA', name: 'Canada', iso3: 'CAN', numeric: '124' },
      { code: 'GB', name: 'United Kingdom', iso3: 'GBR', numeric: '826' },
      { code: 'AU', name: 'Australia', iso3: 'AUS', numeric: '036' },
      { code: 'DE', name: 'Germany', iso3: 'DEU', numeric: '276' },
      { code: 'FR', name: 'France', iso3: 'FRA', numeric: '250' },
      { code: 'ES', name: 'Spain', iso3: 'ESP', numeric: '724' },
      { code: 'BR', name: 'Brazil', iso3: 'BRA', numeric: '076' },
      { code: 'JP', name: 'Japan', iso3: 'JPN', numeric: '392' },
      { code: 'CN', name: 'China', iso3: 'CHN', numeric: '156' },
    ];

    for (const country of countries) {
      await queryRunner.query(
        `INSERT INTO system_countries
         (id, iso_code_2, iso_code_3, iso_numeric, name, official_name, is_active,
          date_created, created_by, is_deleted)
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), 'migration', false)
         ON CONFLICT (iso_code_2) DO NOTHING`,
        [
          uuidv4(),
          country.code,
          country.iso3,
          country.numeric,
          country.name,
          country.name, // Could be expanded to full official names
        ]
      );
    }
  }

  private async createSystemPhoneTypes(queryRunner: QueryRunner): Promise<void> {
    const types = ['Mobile', 'Home', 'Work', 'Fax', 'Other'];

    for (const type of types) {
      await queryRunner.query(
        `INSERT INTO system_phone_types
         (id, name, is_active, sort_order,
          date_created, created_by, is_deleted)
         VALUES ($1, $2, true, $3, NOW(), 'migration', false)
         ON CONFLICT (name) DO NOTHING`,
        [uuidv4(), type, types.indexOf(type) + 1]
      );
    }
  }

  private async createSystemAddressTypes(queryRunner: QueryRunner): Promise<void> {
    const types = ['Home', 'Work', 'Billing', 'Shipping', 'Other'];

    for (const type of types) {
      await queryRunner.query(
        `INSERT INTO system_address_types
         (id, name, is_active, sort_order,
          date_created, created_by, is_deleted)
         VALUES ($1, $2, true, $3, NOW(), 'migration', false)
         ON CONFLICT (name) DO NOTHING`,
        [uuidv4(), type, types.indexOf(type) + 1]
      );
    }
  }

  private async createMasterOrganizationTypes(queryRunner: QueryRunner): Promise<void> {
    const types = [
      { name: 'Customer', code: 'CUST' },
      { name: 'Partner', code: 'PRTN' },
      { name: 'Reseller', code: 'RSLR' },
      { name: 'Vendor', code: 'VNDR' },
      { name: 'Internal', code: 'INTL' },
    ];

    for (const type of types) {
      await queryRunner.query(
        `INSERT INTO system_master_organization_types
         (id, name, code, description, is_active,
          date_created, created_by, is_deleted)
         VALUES ($1, $2, $3, $4, true, NOW(), 'migration', false)
         ON CONFLICT (code) DO NOTHING`,
        [
          uuidv4(),
          type.name,
          type.code,
          `${type.name} organization type`,
        ]
      );
    }
  }

  private async createModuleLicenseTypes(queryRunner: QueryRunner): Promise<void> {
    const types = [
      { name: 'Perpetual', code: 'PERP' },
      { name: 'Subscription', code: 'SUBS' },
      { name: 'Trial', code: 'TRIL' },
      { name: 'Evaluation', code: 'EVAL' },
      { name: 'Development', code: 'DEVL' },
    ];

    for (const type of types) {
      await queryRunner.query(
        `INSERT INTO system_module_license_types
         (id, name, code, description, is_active,
          date_created, created_by, is_deleted)
         VALUES ($1, $2, $3, $4, true, NOW(), 'migration', false)
         ON CONFLICT (code) DO NOTHING`,
        [
          uuidv4(),
          type.name,
          type.code,
          `${type.name} license type`,
        ]
      );
    }
  }

  private async createMigrationMetadataTable(queryRunner: QueryRunner): Promise<void> {
    // Create a temporary table for storing migration metadata
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS migration_metadata (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }
}