// src/commands/reset-database.command.ts
import { Command, CommandRunner, Option } from 'nest-commander';
import { Logger, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

interface ResetDatabaseCommandOptions {
  confirm?: boolean;
  migrate?: boolean;
  seed?: boolean;
}

@Injectable()
@Command({
  name: 'db:reset',
  description: 'Reset the entire database (drop and recreate)',
})
export class ResetDatabaseCommand extends CommandRunner {
  private readonly logger = new Logger(ResetDatabaseCommand.name);

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private configService: ConfigService,
  ) {
    super();
  }

  @Option({
    flags: '-y, --confirm',
    description: 'Confirm database reset without prompt',
  })
  parseConfirmOption(val: boolean): boolean {
    return !!val;
  }

  @Option({
    flags: '-m, --migrate',
    description: 'Run migrations after reset',
  })
  parseMigrateOption(val: boolean): boolean {
    return !!val;
  }

  @Option({
    flags: '-s, --seed',
    description: 'Run seeders after reset and migrations',
  })
  parseSeedOption(val: boolean): boolean {
    return !!val;
  }

  async run(
    passedParams: string[],
    options: ResetDatabaseCommandOptions,
  ): Promise<void> {
    try {
      const dbName = this.configService.get<string>('DB_NAME');
      const dbType = this.configService.get<string>('DB_TYPE');

      if (!options.confirm) {
        this.logger.warn(
          `⚠️ WARNING: This operation will COMPLETELY RESET the "${dbName}" database, DELETING ALL DATA. ⚠️`,
        );
        this.logger.warn('Use --confirm to bypass this warning and proceed with the operation.');
        this.logger.log('');
        this.logger.log('Usage:');
        this.logger.log('  db:reset --confirm [--migrate] [--seed]');
        process.exit(0);
      }

      this.logger.log(`Resetting database "${dbName}"...`);

      // Get connection details for reconnecting later
      const connectionOptions = {
        host: this.configService.get<string>('DB_HOST'),
        port: this.configService.get<number>('DB_PORT'),
        username: this.configService.get<string>('DB_USERNAME'),
        password: this.configService.get<string>('DB_PASSWORD'),
      };

      // Close the current connection
      await this.dataSource.destroy();
      this.logger.log('Database connection closed');

      // Create a new connection to the default database to drop and recreate our target database
      // For PostgreSQL, connect to 'postgres'
      // For MySQL, there's no need to specify a different database as we can drop a database while connected to it
      const defaultDbName = dbType === 'postgres' ? 'postgres' : dbName;
      
      let masterConnection: DataSource;
      
      if (dbType === 'postgres') {
        masterConnection = new DataSource({
          type: 'postgres',
          host: connectionOptions.host,
          port: connectionOptions.port,
          username: connectionOptions.username,
          password: connectionOptions.password,
          database: defaultDbName,
        });
      } else if (dbType === 'mysql') {
        masterConnection = new DataSource({
          type: 'mysql',
          host: connectionOptions.host,
          port: connectionOptions.port,
          username: connectionOptions.username,
          password: connectionOptions.password,
        });
      } else {
        throw new Error(`Unsupported database type: ${dbType}`);
      }

      await masterConnection.initialize();
      this.logger.log(`Connected to ${dbType} server`);

      // Drop the database if it exists
      try {
        if (dbType === 'postgres') {
          // Terminate all connections to the database before dropping
          await masterConnection.query(
            `SELECT pg_terminate_backend(pg_stat_activity.pid) 
             FROM pg_stat_activity 
             WHERE pg_stat_activity.datname = '${dbName}' 
             AND pid <> pg_backend_pid()`,
          );
          await masterConnection.query(`DROP DATABASE IF EXISTS "${dbName}"`);
        } else if (dbType === 'mysql') {
          await masterConnection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
        }
        this.logger.log(`Database "${dbName}" dropped`);
      } catch (error) {
        this.logger.error(`Error dropping database: ${error.message}`);
        throw error;
      }

      // Create the database
      try {
        if (dbType === 'postgres') {
          await masterConnection.query(`CREATE DATABASE "${dbName}"`);
        } else if (dbType === 'mysql') {
          await masterConnection.query(
            `CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
          );
        }
        this.logger.log(`Database "${dbName}" created`);
      } catch (error) {
        this.logger.error(`Error creating database: ${error.message}`);
        throw error;
      }

      // Close the master connection
      await masterConnection.destroy();
      this.logger.log('Database reset completed successfully');

      // If migrate option is provided, run migrations
      if (options.migrate) {
        this.logger.log('Running migrations...');
        // We need to spawn a new process as we can't easily reinitialize the connection within this process
        const { spawn } = require('child_process');
        
        const migrateProcess = spawn('npm', ['run', 'migration:run'], {
          stdio: 'inherit',
          shell: true,
        });

        await new Promise<void>((resolve, reject) => {
          migrateProcess.on('close', (code) => {
            if (code === 0) {
              this.logger.log('Migrations completed successfully');
              resolve();
            } else {
              this.logger.error(`Migrations failed with exit code ${code}`);
              reject(new Error(`Migrations failed with exit code ${code}`));
            }
          });
        });
      }

      // If seed option is provided, run seeders
      if (options.seed) {
        if (!options.migrate) {
          this.logger.warn('Running seeders without migrations may cause errors if tables do not exist');
        }
        
        this.logger.log('Running seeders...');
        const { spawn } = require('child_process');
        
        const seedProcess = spawn('npm', ['run', 'seed'], {
          stdio: 'inherit',
          shell: true,
        });

        await new Promise<void>((resolve, reject) => {
          seedProcess.on('close', (code) => {
            if (code === 0) {
              this.logger.log('Seeding completed successfully');
              resolve();
            } else {
              this.logger.error(`Seeding failed with exit code ${code}`);
              reject(new Error(`Seeding failed with exit code ${code}`));
            }
          });
        });
      }

      this.logger.log('Database reset process completed');
      process.exit(0);
    } catch (error) {
      this.logger.error(`Error resetting database: ${error.message}`, error.stack);
      process.exit(1);
    }
  }
}
