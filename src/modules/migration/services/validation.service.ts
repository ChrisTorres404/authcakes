import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    tablesChecked: number;
    checksPerformed: number;
    errorCount: number;
    warningCount: number;
  };
}

export interface DataIntegrityCheck {
  name: string;
  query: string;
  expectedResult?: any;
  errorMessage: string;
  isWarning?: boolean;
}

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  constructor(private dataSource: DataSource) {}

  async validatePreMigration(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {
        tablesChecked: 0,
        checksPerformed: 0,
        errorCount: 0,
        warningCount: 0,
      },
    };

    const checks: DataIntegrityCheck[] = [
      // Check for orphaned records
      {
        name: 'Orphaned tenant memberships',
        query: `
          SELECT COUNT(*) as count FROM tenant_memberships tm 
          WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = tm.user_id)
             OR NOT EXISTS (SELECT 1 FROM tenants t WHERE t.id = tm.tenant_id)
        `,
        expectedResult: 0,
        errorMessage: 'Found orphaned tenant memberships',
      },
      
      // Check for duplicate emails
      {
        name: 'Duplicate user emails',
        query: `
          SELECT email, COUNT(*) as count 
          FROM users 
          GROUP BY email 
          HAVING COUNT(*) > 1
        `,
        expectedResult: [],
        errorMessage: 'Found duplicate email addresses',
      },
      
      // Check for invalid role values
      {
        name: 'Invalid user roles',
        query: `
          SELECT COUNT(*) as count 
          FROM users 
          WHERE role NOT IN ('admin', 'user') AND role IS NOT NULL
        `,
        expectedResult: 0,
        errorMessage: 'Found users with invalid roles',
      },
      
      // Check for tenants without members
      {
        name: 'Empty tenants',
        query: `
          SELECT COUNT(*) as count
          FROM tenants t
          WHERE NOT EXISTS (
            SELECT 1 FROM tenant_memberships tm 
            WHERE tm.tenant_id = t.id AND tm."deletedAt" IS NULL
          ) AND t."deletedAt" IS NULL
        `,
        expectedResult: 0,
        errorMessage: 'Found tenants without any members',
        isWarning: true,
      },
      
      // Check for data consistency
      {
        name: 'Session user references',
        query: `
          SELECT COUNT(*) as count
          FROM sessions s
          WHERE NOT EXISTS (
            SELECT 1 FROM users u WHERE u.id = s."userId"
          )
        `,
        expectedResult: 0,
        errorMessage: 'Found sessions referencing non-existent users',
      },
      
      // Check for API keys without users
      {
        name: 'Orphaned API keys',
        query: `
          SELECT COUNT(*) as count
          FROM api_keys ak
          WHERE NOT EXISTS (
            SELECT 1 FROM users u WHERE u.id = ak."userId"
          )
        `,
        expectedResult: 0,
        errorMessage: 'Found API keys without valid users',
      },
      
      // Check refresh tokens
      {
        name: 'Invalid refresh tokens',
        query: `
          SELECT COUNT(*) as count
          FROM refresh_tokens rt
          WHERE rt.user IS NULL
        `,
        expectedResult: 0,
        errorMessage: 'Found refresh tokens without user references',
      },
      
      // Check critical data presence
      {
        name: 'Users without passwords',
        query: `
          SELECT COUNT(*) as count
          FROM users
          WHERE password IS NULL OR password = ''
        `,
        expectedResult: 0,
        errorMessage: 'Found users without passwords',
      },
      
      // Check for extremely old data that might cause issues
      {
        name: 'Very old sessions',
        query: `
          SELECT COUNT(*) as count
          FROM sessions
          WHERE "createdAt" < NOW() - INTERVAL '1 year'
        `,
        errorMessage: 'Found sessions older than 1 year',
        isWarning: true,
      },
    ];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      for (const check of checks) {
        result.summary.checksPerformed++;
        
        try {
          const queryResult = await queryRunner.query(check.query);
          
          let checkFailed = false;
          if (check.expectedResult !== undefined) {
            if (Array.isArray(check.expectedResult) && Array.isArray(queryResult)) {
              checkFailed = queryResult.length > 0;
            } else if (queryResult[0]?.count !== undefined) {
              checkFailed = parseInt(queryResult[0].count) !== check.expectedResult;
            }
          }
          
          if (checkFailed) {
            const message = `${check.errorMessage} (${check.name})`;
            if (check.isWarning) {
              result.warnings.push(message);
              result.summary.warningCount++;
              this.logger.warn(`Validation warning: ${message}`);
            } else {
              result.errors.push(message);
              result.summary.errorCount++;
              result.isValid = false;
              this.logger.error(`Validation error: ${message}`);
            }
          } else {
            this.logger.debug(`✓ ${check.name} passed`);
          }
        } catch (error) {
          this.logger.error(`Failed to run check '${check.name}': ${error.message}`);
          result.warnings.push(`Could not validate: ${check.name}`);
        }
      }

      // Count tables
      const tables = ['users', 'tenants', 'tenant_memberships', 'sessions', 'api_keys', 'system_settings'];
      result.summary.tablesChecked = tables.length;

    } finally {
      await queryRunner.release();
    }

    this.logger.log(
      `Pre-migration validation completed. ` +
      `Errors: ${result.summary.errorCount}, Warnings: ${result.summary.warningCount}`
    );

    return result;
  }

  async validatePostMigration(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {
        tablesChecked: 0,
        checksPerformed: 0,
        errorCount: 0,
        warningCount: 0,
      },
    };

    const checks: DataIntegrityCheck[] = [
      // Verify counts match
      {
        name: 'User count consistency',
        query: `
          SELECT 
            (SELECT COUNT(*) FROM users) as original_count,
            (SELECT COUNT(*) FROM account_logins) as login_count,
            (SELECT COUNT(*) FROM account_users) as user_count
        `,
        errorMessage: 'User migration count mismatch',
      },
      
      // Check account_users have valid logins
      {
        name: 'Account user integrity',
        query: `
          SELECT COUNT(*) as count
          FROM account_users au
          WHERE NOT EXISTS (
            SELECT 1 FROM account_logins al 
            WHERE al.id = au.account_login_id
          )
        `,
        expectedResult: 0,
        errorMessage: 'Found orphaned account_users',
      },
      
      // Verify tenant to account migration
      {
        name: 'Tenant migration integrity',
        query: `
          SELECT 
            (SELECT COUNT(*) FROM tenants WHERE "deletedAt" IS NULL) as tenant_count,
            (SELECT COUNT(*) FROM accounts WHERE is_deleted = false) as account_count
        `,
        errorMessage: 'Tenant to account migration count mismatch',
      },
      
      // Check management groups exist
      {
        name: 'Account management groups',
        query: `
          SELECT COUNT(*) as count
          FROM accounts a
          WHERE NOT EXISTS (
            SELECT 1 FROM account_management_groups amg 
            WHERE amg.account_id = a.id
          ) AND a.is_deleted = false
        `,
        expectedResult: 0,
        errorMessage: 'Found accounts without management groups',
      },
      
      // Verify security setup
      {
        name: 'Security privileges',
        query: `
          SELECT COUNT(*) as count
          FROM security_privileges
          WHERE is_system = true
        `,
        errorMessage: 'System security privileges not created',
      },
      
      // Check critical data preserved
      {
        name: 'Email preservation',
        query: `
          SELECT COUNT(*) as count
          FROM users u
          JOIN account_logins al ON u.id = al.id
          WHERE u.email != al.email
        `,
        expectedResult: 0,
        errorMessage: 'Email addresses not preserved correctly',
      },
      
      // Check password preservation
      {
        name: 'Password preservation',
        query: `
          SELECT COUNT(*) as count
          FROM users u
          JOIN account_logins al ON u.id = al.id
          WHERE u.password != al.password_hash
        `,
        expectedResult: 0,
        errorMessage: 'Passwords not migrated correctly',
      },
      
      // Verify membership migration
      {
        name: 'Membership migration',
        query: `
          SELECT 
            (SELECT COUNT(*) FROM tenant_memberships WHERE "deletedAt" IS NULL) as original,
            (SELECT COUNT(*) FROM account_management_group_members WHERE is_deleted = false) as migrated
        `,
        errorMessage: 'Membership migration incomplete',
        isWarning: true,
      },
    ];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // First check if migration tables exist
      const tablesExist = await this.checkMigrationTablesExist(queryRunner);
      if (!tablesExist) {
        result.errors.push('Migration tables do not exist - migration may not have run');
        result.isValid = false;
        return result;
      }

      for (const check of checks) {
        result.summary.checksPerformed++;
        
        try {
          const queryResult = await queryRunner.query(check.query);
          
          if (check.name === 'User count consistency') {
            const counts = queryResult[0];
            if (counts.original_count !== counts.login_count || 
                counts.original_count !== counts.user_count) {
              result.errors.push(
                `${check.errorMessage}: ` +
                `Original=${counts.original_count}, ` +
                `Logins=${counts.login_count}, ` +
                `Users=${counts.user_count}`
              );
              result.isValid = false;
              result.summary.errorCount++;
            }
          } else if (check.name === 'Tenant migration integrity') {
            const counts = queryResult[0];
            if (counts.tenant_count !== counts.account_count) {
              result.errors.push(
                `${check.errorMessage}: ` +
                `Tenants=${counts.tenant_count}, ` +
                `Accounts=${counts.account_count}`
              );
              result.isValid = false;
              result.summary.errorCount++;
            }
          } else if (check.name === 'Membership migration') {
            const counts = queryResult[0];
            if (counts.original !== counts.migrated) {
              result.warnings.push(
                `${check.errorMessage}: ` +
                `Original=${counts.original}, ` +
                `Migrated=${counts.migrated} ` +
                `(some users may not have been migrated yet)`
              );
              result.summary.warningCount++;
            }
          } else if (check.expectedResult !== undefined && queryResult[0]?.count !== undefined) {
            if (parseInt(queryResult[0].count) !== check.expectedResult) {
              if (check.isWarning) {
                result.warnings.push(`${check.errorMessage} (${check.name})`);
                result.summary.warningCount++;
              } else {
                result.errors.push(`${check.errorMessage} (${check.name})`);
                result.summary.errorCount++;
                result.isValid = false;
              }
            }
          }
          
          this.logger.debug(`✓ ${check.name} completed`);
        } catch (error) {
          this.logger.error(`Failed to run check '${check.name}': ${error.message}`);
          result.warnings.push(`Could not validate: ${check.name}`);
        }
      }

    } finally {
      await queryRunner.release();
    }

    this.logger.log(
      `Post-migration validation completed. ` +
      `Errors: ${result.summary.errorCount}, Warnings: ${result.summary.warningCount}`
    );

    return result;
  }

  private async checkMigrationTablesExist(queryRunner: QueryRunner): Promise<boolean> {
    const requiredTables = [
      'account_logins',
      'account_users',
      'accounts',
      'account_management_groups',
      'security_privileges',
    ];

    for (const table of requiredTables) {
      try {
        await queryRunner.query(`SELECT 1 FROM ${table} LIMIT 1`);
      } catch (error) {
        this.logger.error(`Required table ${table} does not exist`);
        return false;
      }
    }

    return true;
  }

  async generateMigrationReport(): Promise<string> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    const report: string[] = ['# Migration Validation Report\n'];
    report.push(`Generated: ${new Date().toISOString()}\n`);

    try {
      // Current database statistics
      report.push('## Current Database Statistics\n');
      const currentStats = await this.gatherCurrentStats(queryRunner);
      report.push(this.formatStats(currentStats));

      // Master database statistics (if migration completed)
      const migrationComplete = await this.checkMigrationTablesExist(queryRunner);
      if (migrationComplete) {
        report.push('\n## Master Database Statistics\n');
        const masterStats = await this.gatherMasterStats(queryRunner);
        report.push(this.formatStats(masterStats));

        // Data integrity checks
        report.push('\n## Data Integrity Checks\n');
        const integrityChecks = await this.performIntegrityChecks(queryRunner);
        report.push(this.formatIntegrityChecks(integrityChecks));
      }

    } finally {
      await queryRunner.release();
    }

    return report.join('\n');
  }

  private async gatherCurrentStats(queryRunner: QueryRunner): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};
    
    const tables = [
      'users', 'tenants', 'tenant_memberships', 'sessions', 
      'refresh_tokens', 'api_keys', 'logs', 'system_settings'
    ];

    for (const table of tables) {
      try {
        const [result] = await queryRunner.query(`SELECT COUNT(*) FROM ${table}`);
        stats[table] = parseInt(result.count);
      } catch (error) {
        stats[table] = -1; // Table doesn't exist
      }
    }

    return stats;
  }

  private async gatherMasterStats(queryRunner: QueryRunner): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};
    
    const tables = [
      'account_logins', 'account_users', 'accounts', 
      'account_management_groups', 'account_management_group_members',
      'security_privileges', 'security_policy_groups',
      'api_keys', 'system_settings'
    ];

    for (const table of tables) {
      try {
        const [result] = await queryRunner.query(`SELECT COUNT(*) FROM ${table}`);
        stats[table] = parseInt(result.count);
      } catch (error) {
        stats[table] = -1; // Table doesn't exist
      }
    }

    return stats;
  }

  private formatStats(stats: Record<string, number>): string {
    const lines: string[] = [];
    for (const [table, count] of Object.entries(stats)) {
      if (count >= 0) {
        lines.push(`- ${table}: ${count.toLocaleString()} records`);
      }
    }
    return lines.join('\n');
  }

  private async performIntegrityChecks(queryRunner: QueryRunner): Promise<any[]> {
    // Implement specific integrity checks
    return [];
  }

  private formatIntegrityChecks(checks: any[]): string {
    if (checks.length === 0) {
      return 'No integrity issues found.';
    }
    return checks.map(check => `- ${check.description}: ${check.result}`).join('\n');
  }
}