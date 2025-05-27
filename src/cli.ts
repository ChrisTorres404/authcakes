import { CommandFactory } from 'nest-commander';
import { CliModule } from './cli.module';
import { Logger } from '@nestjs/common';

Logger.log('CLI bootstrap starting...');

async function bootstrap() {
  try {
    Logger.log('Attempting to initialize CommandFactory with CliModule...');
    console.log('Debug: Before CommandFactory.run()');
    
    const result = await CommandFactory.run(CliModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
      cliName: 'authcakes-cli',
    });
    
    console.log('Debug: After CommandFactory.run()', result);
    Logger.log('CommandFactory.run() completed successfully');
  } catch (error) {
    Logger.error(`CLI Error: ${error.message}`, error.stack);
    console.error('Detailed error object:', error);
    process.exit(1);
  }
}

bootstrap().catch(err => {
  console.error('Unhandled bootstrap error:', err);
  process.exit(1);
});