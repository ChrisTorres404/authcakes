// src/commands/seed.command.ts
import { Command, CommandRunner } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { SeederService } from '../modules/database/seeds/seeder.service';

@Command({ name: 'seed', description: 'Seed the database with initial data' })
export class SeedCommand extends CommandRunner {
  private readonly logger = new Logger(SeedCommand.name);

  constructor(private readonly seederService: SeederService) {
    super();
    Logger.log('SeedCommand constructed');
  }

  async run(): Promise<void> {
    this.logger.log('Starting database seeding...');
    
    try {
      await this.seederService.seed();
      this.logger.log('Database seeding completed successfully!');
      process.exit(0);
    } catch (error) {
      this.logger.error(`Error during database seeding: ${error.message}`, error.stack);
      process.exit(1);
    }
  }
}