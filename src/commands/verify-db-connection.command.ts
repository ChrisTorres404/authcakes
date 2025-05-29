// src/commands/verify-db-connection.command.ts
import { Command, CommandRunner } from 'nest-commander';
import { Logger, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { ConfigService } from '@nestjs/config';

interface DatabaseConfig {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

interface DatabaseError {
  message: string;
  code?: string;
  stack?: string;
}

function isDatabaseError(error: unknown): error is DatabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as DatabaseError).message === 'string'
  );
}

interface TableCountResult {
  count: string;
}

/**
 * Command to verify database connection and schema status.
 * Performs comprehensive database checks including connection testing,
 * schema verification, and basic data presence validation.
 *
 * @example
 * ```bash
 * # Verify database connection and schema
 * npm run cli db:verify
 * ```
 */
@Injectable()
@Command({
  name: 'db:verify',
  description: 'Verify database connection before migrations/seeding',
})
export class VerifyDbConnectionCommand extends CommandRunner {
  private readonly logger = new Logger(VerifyDbConnectionCommand.name);

  constructor(private configService: ConfigService) {
    super();
  }

  /**
   * Executes the database verification command.
   * Performs the following checks:
   * 1. Validates database configuration
   * 2. Tests connection to database
   * 3. Verifies existence of required tables
   * 4. Checks for presence of seed data
   *
   * @throws {Error} If database configuration is invalid
   * @throws {Error} If database connection fails
   * @throws {Error} If required tables are missing
   * @returns Promise<void>
   */
  async run(): Promise<void> {
    try {
      this.logger.log('Verifying database connection...');

      // Extract database configuration from environment variables
      const dbConfig: DatabaseConfig = {
        type: this.configService.get<string>('DB_TYPE', 'postgres'),
        host: this.configService.get<string>('DB_HOST', 'localhost'),
        port: this.configService.get<number>('DB_PORT', 5432),
        username: this.configService.get<string>('DB_USERNAME', ''),
        password: this.configService.get<string>('DB_PASSWORD', ''),
        database: this.configService.get<string>('DB_NAME', ''),
      };

      // Validate required configuration
      const missingVars = Object.entries(dbConfig)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingVars.length > 0) {
        this.logger.error(
          `Missing required database configuration: ${missingVars.join(', ')}`,
        );
        this.logger.error(
          'Please check your .env file and ensure all required variables are set',
        );
        process.exit(1);
      }

      this.logger.log(
        'Database configuration is valid. Attempting connection...',
      );

      // Create a temporary connection to test database access
      const dataSource = new DataSource({
        type: 'postgres',
        host: dbConfig.host,
        port: dbConfig.port,
        username: dbConfig.username,
        password: dbConfig.password,
        database: dbConfig.database,
      } as PostgresConnectionOptions);

      // Try to connect
      await dataSource.initialize();
      this.logger.log('✅ Database connection successful!');

      // Verify if basic tables exist
      const queryRunner = dataSource.createQueryRunner();
      const tables = await queryRunner.getTables();
      await queryRunner.release();

      const tableNames = tables.map((table) => table.name).join(', ');

      if (tables.length === 0) {
        this.logger.warn(
          'No tables found in the database. You may need to run migrations.',
        );
      } else {
        this.logger.log(`Found ${tables.length} tables: ${tableNames}`);

        // Look for specific key tables
        const requiredTables = ['users', 'tenants', 'system_settings'] as const;
        const missingTables = requiredTables.filter(
          (table) => !tables.some((t) => t.name === table),
        );

        if (missingTables.length > 0) {
          this.logger.warn(
            `Missing key tables: ${missingTables.join(', ')}. You may need to run migrations.`,
          );
        } else {
          this.logger.log('All key tables are present.');

          // Check if tables have data
          for (const tableName of requiredTables) {
            const count = await dataSource.query<TableCountResult[]>(
              `SELECT COUNT(*) as count FROM "${tableName}"`,
            );
            const recordCount = parseInt(count[0].count, 10);

            if (recordCount === 0) {
              this.logger.warn(
                `Table '${tableName}' exists but has no data. You may need to run seeders.`,
              );
            } else {
              this.logger.log(
                `Table '${tableName}' has ${recordCount} records.`,
              );
            }
          }
        }
      }

      // Close the connection
      await dataSource.destroy();

      this.logger.log('Database verification completed');
      process.exit(0);
    } catch (error: unknown) {
      const dbError = isDatabaseError(error)
        ? error
        : { message: 'Unknown database error', code: 'UNKNOWN' };

      this.logger.error(`Database connection failed: ${dbError.message}`);
      this.logger.error(
        'Please check your database configuration and ensure the database is running',
      );

      // Provide more detailed error information based on error type
      if (dbError.code === 'ECONNREFUSED') {
        this.logger.error(
          `Could not connect to database at ${this.configService.get<string>('DB_HOST')}:${this.configService.get<number>('DB_PORT')}`,
        );
        this.logger.error(
          'Make sure your database server is running and accessible',
        );
      } else if (
        dbError.code === 'ER_ACCESS_DENIED_ERROR' ||
        dbError.code === '28P01'
      ) {
        this.logger.error(
          'Access denied. Check your DB_USERNAME and DB_PASSWORD',
        );
      } else if (
        dbError.code === 'ER_BAD_DB_ERROR' ||
        dbError.code === '3D000'
      ) {
        this.logger.error(
          `Database '${this.configService.get<string>('DB_NAME')}' does not exist`,
        );
        this.logger.error('You may need to create the database first');
      }

      process.exit(1);
    }
  }
}
