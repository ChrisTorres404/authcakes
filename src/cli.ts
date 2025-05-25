import { CommandFactory } from 'nest-commander';
import { CliModule } from './cli.module';
import { Logger } from '@nestjs/common';

Logger.log('CLI bootstrap starting...');

async function bootstrap() {
  try {
    await CommandFactory.run(CliModule);
  } catch (error) {
    Logger.error('CLI Error:', error);
    process.exit(1);
  }
}

bootstrap(); 