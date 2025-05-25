import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { SeedCommand } from './commands/seed.command';

@Module({
  imports: [DatabaseModule],
  providers: [SeedCommand],
})
export class CliModule {} 