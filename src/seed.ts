import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { SeederService } from './modules/database/seeds/seeder.service';

async function bootstrap() {
  Logger.log('Starting database seeding script...');

  try {
    // Create a standalone application context for seeding
    const appContext = await NestFactory.createApplicationContext(AppModule);
    
    // Get the SeederService from the app context
    const seederService = appContext.get(SeederService);
    
    Logger.log('Running database seed operations...');
    
    // Run the seed method
    await seederService.seed();
    
    Logger.log('Database seeding completed successfully!');
    
    // Close the app context when done
    await appContext.close();
    process.exit(0);
  } catch (error) {
    Logger.error(`Error during database seeding: ${error.message}`, error.stack);
    process.exit(1);
  }
}

bootstrap(); 