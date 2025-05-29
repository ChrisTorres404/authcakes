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
    if (error instanceof Error) {
      Logger.error(`CLI Error: ${error.message}`, error.stack);
    } else {
      Logger.error('CLI Error: Unknown error', String(error));
    }
    console.error('Detailed error object:', error);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error('Unhandled bootstrap error:', err);
  process.exit(1);
});
