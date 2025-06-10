import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { RollbackService } from '../services/rollback.service';

interface RollbackCommandOptions {
  checkpoint?: string;
  list?: boolean;
  force?: boolean;
}

@Injectable()
@Command({
  name: 'rollback',
  description: 'Rollback migration to a previous checkpoint',
})
export class RollbackCommand extends CommandRunner {
  constructor(private rollbackService: RollbackService) {
    super();
  }

  async run(
    passedParams: string[],
    options: RollbackCommandOptions,
  ): Promise<void> {
    try {
      // List checkpoints if requested
      if (options.list) {
        await this.listCheckpoints();
        return;
      }

      // Require checkpoint ID
      if (!options.checkpoint) {
        console.error('❌ Error: Checkpoint ID is required (use --list to see available checkpoints)');
        process.exit(1);
      }

      console.log('⏮️  Starting Migration Rollback...\n');

      // Confirm rollback
      if (!options.force) {
        console.log('⚠️  WARNING: This will rollback the database to a previous state!');
        console.log('   Use --force to skip this confirmation.\n');
        
        // In a real implementation, prompt for confirmation
        console.log('   Would you like to continue? (y/N)');
        console.log('   [Simulating user input: N]');
        console.log('\n❌ Rollback cancelled by user');
        return;
      }

      console.log(`🎯 Rolling back to checkpoint: ${options.checkpoint}\n`);

      const result = await this.rollbackService.rollbackToCheckpoint(options.checkpoint);

      if (result.success) {
        console.log('✅ Rollback completed successfully!\n');
        console.log('📊 Rollback Summary:');
        console.log(`   Checkpoint: ${result.checkpointId}`);
        console.log(`   Tables Affected: ${result.tablesAffected.length}`);
        console.log(`   Records Restored: ${result.recordsRestored.toLocaleString()}`);

        if (result.tablesAffected.length > 0) {
          console.log('\n📋 Tables Affected:');
          result.tablesAffected.forEach(table => {
            console.log(`   - ${table}`);
          });
        }

        console.log('\n✅ Database has been rolled back successfully!');
        console.log('   Run "npm run cli validate --stage pre" to verify the state');
      } else {
        console.log('❌ Rollback failed!\n');
        if (result.errors.length > 0) {
          console.log('Errors:');
          result.errors.forEach(error => {
            console.log(`   - ${error}`);
          });
        }
        process.exit(1);
      }
    } catch (error) {
      console.error('\n❌ Rollback Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  private async listCheckpoints(): Promise<void> {
    console.log('📋 Available Checkpoints:\n');

    const checkpoints = await this.rollbackService.listCheckpoints();

    if (checkpoints.length === 0) {
      console.log('   No checkpoints found. Run migration first to create checkpoints.');
      return;
    }

    console.log('   ID                                   | Type           | Created At          | Description');
    console.log('   -------------------------------------|----------------|---------------------|------------------------');

    checkpoints.forEach(checkpoint => {
      const date = new Date(checkpoint.createdAt).toISOString().split('T')[0];
      const time = new Date(checkpoint.createdAt).toISOString().split('T')[1].split('.')[0];
      const desc = checkpoint.description || 'N/A';
      
      console.log(
        `   ${checkpoint.id} | ${checkpoint.type.padEnd(14)} | ${date} ${time} | ${desc.substring(0, 24)}`
      );
    });

    console.log('\n💡 To rollback, run: npm run cli rollback --checkpoint <ID> --force');
  }

  @Option({
    flags: '-c, --checkpoint <id>',
    description: 'Checkpoint ID to rollback to',
  })
  parseCheckpoint(value: string): string {
    return value;
  }

  @Option({
    flags: '-l, --list',
    description: 'List available checkpoints',
  })
  parseList(): boolean {
    return true;
  }

  @Option({
    flags: '-f, --force',
    description: 'Skip confirmation prompt',
  })
  parseForce(): boolean {
    return true;
  }
}