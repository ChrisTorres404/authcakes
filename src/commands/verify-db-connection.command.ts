// src/commands/verify-db-connection.command.ts
import { Command, CommandRunner } from 'nest-commander';
import { Logger, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
@Command({
  name: 'db:verify',
  description: 'Verify database connection before migrations/seeding',
})
export class VerifyDbConnectionCommand extends CommandRunner {
  private readonly logger = new Logger(VerifyDbConnectionCommand.name);

  constructor(
    private configService: ConfigService,
  ) {
    super();
  }

  async run(): Promise<void> {
    try {
      this.logger.log('Verifying database connection...');
      
      // Extract database configuration from environment variables
      const dbConfig = {
        type: this.configService.get<string>('DB_TYPE'),
        host: this.configService.get<string>('DB_HOST'),
        port: this.configService.get<number>('DB_PORT'),
        username: this.configService.get<string>('DB_USERNAME'),
        password: this.configService.get<string>('DB_PASSWORD'),
        database: this.configService.get<string>('DB_NAME'),
      };
      
      // Validate required configuration
      const missingVars = Object.entries(dbConfig)
        .filter(([_, value]) => !value)
        .map(([key]) => key);
      
      if (missingVars.length > 0) {
        this.logger.error(`Missing required database configuration: ${missingVars.join(', ')}`);
        this.logger.error('Please check your .env file and ensure all required variables are set');
        process.exit(1);
      }
      
      this.logger.log('Database configuration is valid. Attempting connection...');
      
      // Create a temporary connection to test database access
      const dataSource = new DataSource({
        type: dbConfig.type as any,
        host: dbConfig.host,
        port: dbConfig.port,
        username: dbConfig.username,
        password: dbConfig.password,
        database: dbConfig.database,
      });
      
      // Try to connect
      await dataSource.initialize();
      this.logger.log('✅ Database connection successful!');
      
      // Verify if basic tables exist
      const queryRunner = dataSource.createQueryRunner();
      const tables = await queryRunner.getTables();
      await queryRunner.release();
      
      const tableNames = tables.map(t => t.name).join(', ');
      
      if (tables.length === 0) {
        this.logger.warn('No tables found in the database. You may need to run migrations.');
      } else {
        this.logger.log(`Found ${tables.length} tables: ${tableNames}`);
        
        // Look for specific key tables
        const requiredTables = ['users', 'tenants', 'system_settings'];
        const missingTables = requiredTables.filter(table => !tables.some(t => t.name === table));
        
        if (missingTables.length > 0) {
          this.logger.warn(`Missing key tables: ${missingTables.join(', ')}. You may need to run migrations.`);
        } else {
          this.logger.log('All key tables are present.');
          
          // Check if tables have data
          for (const tableName of requiredTables) {
            const count = await dataSource.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
            const recordCount = parseInt(count[0].count, 10);
            
            if (recordCount === 0) {
              this.logger.warn(`Table '${tableName}' exists but has no data. You may need to run seeders.`);
            } else {
              this.logger.log(`Table '${tableName}' has ${recordCount} records.`);
            }
          }
        }
      }
      
      // Close the connection
      await dataSource.destroy();
      
      this.logger.log('Database verification completed');
      process.exit(0);
    } catch (error) {
      this.logger.error(`Database connection failed: ${error.message}`);
      this.logger.error('Please check your database configuration and ensure the database is running');
      
      // Provide more detailed error information based on error type
      if (error.code === 'ECONNREFUSED') {
        this.logger.error(`Could not connect to database at ${this.configService.get<string>('DB_HOST')}:${this.configService.get<number>('DB_PORT')}`);
        this.logger.error('Make sure your database server is running and accessible');
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === '28P01') {
        this.logger.error('Access denied. Check your DB_USERNAME and DB_PASSWORD');
      } else if (error.code === 'ER_BAD_DB_ERROR' || error.code === '3D000') {
        this.logger.error(`Database '${this.configService.get<string>('DB_NAME')}' does not exist`);
        this.logger.error('You may need to create the database first');
      }
      
      process.exit(1);
    }
  }
}
