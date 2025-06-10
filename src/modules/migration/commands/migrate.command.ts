import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { MigrationOrchestrator, MigrationType } from '../services/migration-orchestrator.service';

interface MigrateCommandOptions {
  dryRun?: boolean;
  batchSize?: number;
  types?: string;
  continueOnError?: boolean;
}

@Injectable()
@Command({
  name: 'migrate',
  description: 'Run database migration from current schema to master schema',
})
export class MigrateCommand extends CommandRunner {
  constructor(private migrationOrchestrator: MigrationOrchestrator) {
    super();
  }

  async run(
    passedParams: string[],
    options: MigrateCommandOptions,
  ): Promise<void> {
    console.log('🚀 Starting AuthCakes Database Migration...\n');

    try {
      // Parse migration types if specified
      let types: MigrationType[] | undefined;
      if (options.types) {
        types = options.types.split(',').map(t => t.trim().toUpperCase() as MigrationType);
        console.log(`📋 Running specific migrations: ${types.join(', ')}\n`);
      } else {
        console.log('📋 Running full migration...\n');
      }

      // Show current status
      const status = await this.migrationOrchestrator.getMigrationStatus();
      console.log('📊 Current Status:');
      console.log(`   Last Migration: ${status.lastMigration?.type || 'None'}`);
      console.log(`   Active Checkpoint: ${status.activeCheckpoint?.type || 'None'}`);
      console.log(`   Pending: ${status.pendingMigrations.join(', ') || 'None'}\n`);

      if (options.dryRun) {
        console.log('⚠️  DRY RUN MODE - No changes will be made\n');
      }

      // Run migration
      const result = await this.migrationOrchestrator.migrate({
        dryRun: options.dryRun || false,
        batchSize: options.batchSize || 1000,
        continueOnError: options.continueOnError || false,
        types,
      });

      // Display results
      console.log('\n📊 Migration Results:');
      console.log(`   Success: ${result.success ? '✅' : '❌'}`);
      console.log(`   Total Time: ${result.summary.totalTime}s`);
      console.log(`   Records Processed: ${result.summary.recordsProcessed.toLocaleString()}`);
      console.log(`   Records Failed: ${result.summary.recordsFailed.toLocaleString()}`);
      console.log(`   Tables Affected: ${result.summary.tablesAffected.join(', ')}`);

      // Show individual migration results
      console.log('\n📝 Migration Details:');
      for (const log of result.logs) {
        const icon = log.status === 'completed' ? '✅' : '❌';
        const successRate = log.getSuccessRate();
        console.log(
          `   ${icon} ${log.type}: ${log.processedRecords}/${log.totalRecords} ` +
          `(${successRate.toFixed(2)}% success) - ${log.durationSeconds}s`
        );
      }

      // Show errors if any
      if (result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.message}`);
        });
      }

      // Final status
      if (result.success) {
        console.log('\n✅ Migration completed successfully!');
        console.log('   Run "npm run cli validate" to verify data integrity');
      } else {
        console.log('\n❌ Migration failed!');
        console.log('   Check logs for details and consider running rollback if needed');
        process.exit(1);
      }
    } catch (error) {
      console.error('\n❌ Fatal Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  @Option({
    flags: '-d, --dry-run',
    description: 'Run migration in dry-run mode (no changes)',
  })
  parseDryRun(): boolean {
    return true;
  }

  @Option({
    flags: '-b, --batch-size <size>',
    description: 'Number of records to process in each batch',
    defaultValue: '1000',
  })
  parseBatchSize(value: string): number {
    return parseInt(value, 10);
  }

  @Option({
    flags: '-t, --types <types>',
    description: 'Comma-separated list of migration types to run',
  })
  parseTypes(value: string): string {
    return value;
  }

  @Option({
    flags: '-c, --continue-on-error',
    description: 'Continue migration even if some steps fail',
  })
  parseContinueOnError(): boolean {
    return true;
  }
}