// src/commands/seed.command.ts
import { Command, CommandRunner, Option } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { SeederService, SeederOptions } from '../modules/database/seeds/seeder.service';

interface SeedCommandOptions {
  force?: boolean;
}

@Command({ name: 'seed', description: 'Seed the database with initial data' })
export class SeedCommand extends CommandRunner {
  private readonly logger = new Logger(SeedCommand.name);

  constructor(private readonly seederService: SeederService) {
    super();
    Logger.log('SeedCommand constructed');
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
    console.log('SeedCommand.run() called with options:', options);
    this.logger.log('SeedCommand.run() called with options: ' + JSON.stringify(options));
    
    try {
      const seederOptions: SeederOptions = {
        force: options.force,
      };
      
      await this.seederService.seed(seederOptions);
      this.logger.log('Database seeding completed successfully!');
      process.exit(0);
    } catch (error) {
      this.logger.error(`Error during database seeding: ${error.message}`, error.stack);
      process.exit(1);
    }
  }
}
