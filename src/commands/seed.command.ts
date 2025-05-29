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
}

/**
 * Command to seed the database with initial data.
 * Executes seeding operations using the SeederService to populate
 * the database with initial records for testing or development.
 *
 * @example
 * ```bash
 * # Seed database with initial data
 * npm run cli seed
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

  async run(
    passedParams: string[],
    options: SeedCommandOptions,
  ): Promise<void> {
    try {
      this.logger.log('Starting database seeding...');
      const seederOptions: SeederOptions = {
        force: options.force,
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
