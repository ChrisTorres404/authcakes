// src/commands/truncate-tables.command.ts
import { Command, CommandRunner, Option } from 'nest-commander';
import { Logger, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface TruncateTablesCommandOptions {
  tables?: string;
  all?: boolean;
  confirm?: boolean;
}

@Injectable()
@Command({
  name: 'db:truncate',
  description: 'Truncate specific tables to allow re-seeding',
})
export class TruncateTablesCommand extends CommandRunner {
  private readonly logger = new Logger(TruncateTablesCommand.name);
  private readonly seedableTables = [
    'users',
    'tenants',
    'tenant_memberships',
    'logs',
    'api_keys',
    'mfa_recovery_codes',
    'webauthn_credentials',
    'user_devices',
    'tenant_invitations',
    'system_settings',
  ];

  constructor(@InjectDataSource() private dataSource: DataSource) {
    super();
  }

  @Option({
    flags: '-t, --tables [tables]',
    description: 'Comma-separated list of tables to truncate',
  })
  parseTablesOption(val: string): string {
    return val;
  }

  @Option({
    flags: '-a, --all',
    description: 'Truncate all seedable tables',
  })
  parseAllOption(val: boolean): boolean {
    return !!val;
  }

  @Option({
    flags: '-y, --confirm',
    description: 'Confirm truncation without prompt',
  })
  parseConfirmOption(val: boolean): boolean {
    return !!val;
  }

  async run(
    passedParams: string[],
    options: TruncateTablesCommandOptions,
  ): Promise<void> {
    try {
      let tablesToTruncate: string[] = [];
      
      if (options.all) {
        tablesToTruncate = [...this.seedableTables];
        this.logger.log(`Preparing to truncate all seedable tables: ${tablesToTruncate.join(', ')}`);
      } else if (options.tables) {
        tablesToTruncate = options.tables.split(',').map(t => t.trim());
        this.logger.log(`Preparing to truncate tables: ${tablesToTruncate.join(', ')}`);
      } else {
        this.logger.error('No tables specified. Use --tables or --all option.');
        this.printHelp();
        process.exit(1);
      }

      // Verify all specified tables exist
      const existingTables = await this.getExistingTables();
      const nonExistentTables = tablesToTruncate.filter(
        table => !existingTables.includes(table),
      );
      
      if (nonExistentTables.length > 0) {
        this.logger.error(`The following tables do not exist: ${nonExistentTables.join(', ')}`);
        process.exit(1);
      }

      if (!options.confirm) {
        this.logger.warn(
          'This operation will DELETE ALL DATA in the specified tables. Use --confirm to bypass this warning.',
        );
        process.exit(0);
      }

      // Perform the truncation
      await this.truncateTables(tablesToTruncate);
      
      this.logger.log('Tables truncated successfully. You can now run the seed command.');
      process.exit(0);
    } catch (error) {
      this.logger.error(`Error truncating tables: ${error.message}`, error.stack);
      process.exit(1);
    }
  }

  private async getExistingTables(): Promise<string[]> {
    const query = this.dataSource.createQueryRunner();
    const tables = await query.getTables();
    await query.release();
    return tables.map(table => table.name);
  }

  private async truncateTables(tables: string[]): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      
      // Disable foreign key checks for the truncation
      if (this.dataSource.options.type === 'postgres') {
        await queryRunner.query('SET CONSTRAINTS ALL DEFERRED');
      } else if (this.dataSource.options.type === 'mysql') {
        await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
      }
      
      for (const table of tables) {
        this.logger.log(`Truncating table: ${table}`);
        await queryRunner.query(`TRUNCATE TABLE "${table}" CASCADE`);
      }
      
      // Re-enable foreign key checks
      if (this.dataSource.options.type === 'postgres') {
        await queryRunner.query('SET CONSTRAINTS ALL IMMEDIATE');
      } else if (this.dataSource.options.type === 'mysql') {
        await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
      }
      
      await queryRunner.commitTransaction();
      this.logger.log('All tables truncated successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private printHelp(): void {
    this.logger.log('Usage:');
    this.logger.log('  db:truncate --tables table1,table2,table3 --confirm');
    this.logger.log('  db:truncate --all --confirm');
    this.logger.log('\nAvailable seedable tables:');
    this.logger.log(`  ${this.seedableTables.join(', ')}`);
  }
}
