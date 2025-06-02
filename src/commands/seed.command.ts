// src/commands/seed.command.ts
import { Command, CommandRunner, Option } from 'nest-commander';
import { Logger } from '@nestjs/common';
import {
  SeederService,
  SeederOptions,
} from '../modules/database/seeds/seeder.service';
import { isDatabaseError } from './types/database.types';

/** Options for the database seed command */
export interface SeedCommandOptions {
  force?: boolean;
  environment?: string;
}

/**
 * Command to seed the database with initial data.
 * Supports environment-specific seeding for development, test, and production.
 *
 * @example
 * ```bash
 * # Seed database with data for current NODE_ENV
 * npm run cli seed
 *
 * # Seed with specific environment data
 * npm run cli seed --environment test
 * npm run cli seed --environment development
 * npm run cli seed --environment production
 *
 * # Force seed even if tables have data
 * npm run cli seed --force
 * ```
 *
 * @throws {Error} If seeding operations fail
 * @throws {Error} If database is not accessible
 */
@Command({ name: 'seed', description: 'Seed the database with initial data' })
export class SeedCommand extends CommandRunner {
  private readonly logger = new Logger(SeedCommand.name);

  constructor(private readonly seederService: SeederService) {
    super();
  }

  @Option({
    flags: '-f, --force',
    description: 'Force seeding even if tables are not empty',
  })
  parseForceOption(val: boolean): boolean {
    return !!val;
  }

  @Option({
    flags: '-e, --environment <environment>',
    description: 'Environment to seed for (development, test, production)',
  })
  parseEnvironmentOption(val: string): string {
    return val;
  }

  async run(
    passedParams: string[],
    options: SeedCommandOptions,
  ): Promise<void> {
    try {
      const environment = options.environment || process.env.NODE_ENV || 'development';
      this.logger.log(`Starting database seeding for ${environment} environment...`);
      
      const seederOptions: SeederOptions = {
        force: options.force,
        environment: environment as 'development' | 'test' | 'production',
      };

      await this.seederService.seed(seederOptions);
      this.logger.log('Database seeding completed successfully!');
      process.exit(0);
    } catch (error: unknown) {
      const dbError = isDatabaseError(error)
        ? error
        : { message: 'Unknown error during seeding' };

      this.logger.error(
        `Error during database seeding: ${dbError.message}`,
        dbError.stack,
      );
      process.exit(1);
    }
  }
}