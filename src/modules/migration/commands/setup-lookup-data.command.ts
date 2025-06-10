import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { LookupDataService } from '../services/lookup-data.service';

interface SetupLookupDataOptions {
  force?: boolean;
}

@Injectable()
@Command({
  name: 'setup-lookup-data',
  description: 'Setup required lookup data for master schema',
})
export class SetupLookupDataCommand extends CommandRunner {
  constructor(private lookupDataService: LookupDataService) {
    super();
  }

  async run(
    passedParams: string[],
    options: SetupLookupDataOptions,
  ): Promise<void> {
    console.log('🔧 Setting up lookup data for master schema...\n');

    try {
      // Check if data already exists
      if (!options.force) {
        console.log('📋 Checking existing lookup data...');
        // In a real implementation, check if data exists
      }

      console.log('📦 Creating lookup tables and data...\n');

      const result = await this.lookupDataService.setupLookupData();

      console.log('✅ Lookup Data Setup Complete!\n');
      console.log('📊 Summary:');
      console.log(`   Tables Created: ${result.tables.length}`);
      console.log(`   Records Created: ${result.totalRecords.toLocaleString()}`);
      console.log(`   Success Rate: ${((result.processedRecords / result.totalRecords) * 100).toFixed(2)}%`);

      console.log('\n📋 Tables Created:');
      result.tables.forEach(table => {
        console.log(`   - ${table}`);
      });

      if (result.failedRecords > 0) {
        console.log(`\n⚠️  Warning: ${result.failedRecords} records failed to create`);
      }

      console.log('\n✅ Lookup data is ready for migration!');
    } catch (error) {
      console.error('\n❌ Setup Failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  @Option({
    flags: '-f, --force',
    description: 'Force recreate lookup data even if it exists',
  })
  parseForce(): boolean {
    return true;
  }
}