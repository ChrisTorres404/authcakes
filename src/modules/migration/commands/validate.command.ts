import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { ValidationService } from '../services/validation.service';
import { UserMigrationService } from '../services/user-migration.service';
import { TenantMigrationService } from '../services/tenant-migration.service';
import { SecurityMigrationService } from '../services/security-migration.service';

interface ValidateCommandOptions {
  stage?: 'pre' | 'post' | 'both';
  report?: boolean;
  detailed?: boolean;
}

@Injectable()
@Command({
  name: 'validate',
  description: 'Validate database migration data integrity',
})
export class ValidateCommand extends CommandRunner {
  constructor(
    private validationService: ValidationService,
    private userMigration: UserMigrationService,
    private tenantMigration: TenantMigrationService,
    private securityMigration: SecurityMigrationService,
  ) {
    super();
  }

  async run(
    passedParams: string[],
    options: ValidateCommandOptions,
  ): Promise<void> {
    console.log('🔍 Running Migration Validation...\n');

    const stage = options.stage || 'both';
    let hasErrors = false;

    try {
      // Pre-migration validation
      if (stage === 'pre' || stage === 'both') {
        console.log('📋 Pre-Migration Validation:');
        const preResult = await this.validationService.validatePreMigration();
        
        this.displayValidationResult(preResult, options.detailed);
        
        if (!preResult.isValid) {
          hasErrors = true;
          if (stage === 'pre') {
            console.log('\n❌ Pre-migration validation failed!');
            process.exit(1);
          }
        }
      }

      // Post-migration validation
      if (stage === 'post' || stage === 'both') {
        console.log('\n📋 Post-Migration Validation:');
        const postResult = await this.validationService.validatePostMigration();
        
        this.displayValidationResult(postResult, options.detailed);
        
        if (!postResult.isValid) {
          hasErrors = true;
        }

        // Run module-specific validations
        console.log('\n📋 Module-Specific Validations:');
        
        // User migration validation
        const userValidation = await this.userMigration.validateUserMigration();
        console.log(`\n   👤 User Migration:`);
        if (userValidation.isValid) {
          console.log('      ✅ Valid');
        } else {
          console.log('      ❌ Invalid');
          userValidation.errors.forEach(error => {
            console.log(`         - ${error}`);
          });
          hasErrors = true;
        }

        // Tenant migration validation
        const tenantValidation = await this.tenantMigration.validateTenantMigration();
        console.log(`\n   🏢 Tenant Migration:`);
        if (tenantValidation.isValid) {
          console.log('      ✅ Valid');
        } else {
          console.log('      ❌ Invalid');
          tenantValidation.errors.forEach(error => {
            console.log(`         - ${error}`);
          });
          hasErrors = true;
        }
        if (tenantValidation.warnings.length > 0) {
          console.log('      ⚠️  Warnings:');
          tenantValidation.warnings.forEach(warning => {
            console.log(`         - ${warning}`);
          });
        }

        // Security migration validation
        const securityValidation = await this.securityMigration.validateSecurityMigration();
        console.log(`\n   🔒 Security Migration:`);
        if (securityValidation.isValid) {
          console.log('      ✅ Valid');
        } else {
          console.log('      ❌ Invalid');
          securityValidation.errors.forEach(error => {
            console.log(`         - ${error}`);
          });
          hasErrors = true;
        }
        if (securityValidation.warnings.length > 0) {
          console.log('      ⚠️  Warnings:');
          securityValidation.warnings.forEach(warning => {
            console.log(`         - ${warning}`);
          });
        }
      }

      // Generate report if requested
      if (options.report) {
        console.log('\n📄 Generating Validation Report...');
        const report = await this.validationService.generateMigrationReport();
        const filename = `migration-validation-${new Date().toISOString().split('T')[0]}.md`;
        
        // In a real implementation, write to file
        console.log(`\n📄 Report Preview:\n`);
        console.log(report.substring(0, 500) + '...');
        console.log(`\n💾 Full report would be saved to: ${filename}`);
      }

      // Final result
      if (hasErrors) {
        console.log('\n❌ Validation failed! Please fix the issues before proceeding.');
        process.exit(1);
      } else {
        console.log('\n✅ All validations passed!');
      }

    } catch (error) {
      console.error('\n❌ Validation Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  private displayValidationResult(result: any, detailed: boolean): void {
    console.log(`   Tables Checked: ${result.summary.tablesChecked}`);
    console.log(`   Checks Performed: ${result.summary.checksPerformed}`);
    console.log(`   Errors: ${result.summary.errorCount}`);
    console.log(`   Warnings: ${result.summary.warningCount}`);

    if (result.errors.length > 0) {
      console.log('\n   ❌ Errors:');
      result.errors.forEach((error: string) => {
        console.log(`      - ${error}`);
      });
    }

    if (result.warnings.length > 0) {
      console.log('\n   ⚠️  Warnings:');
      result.warnings.forEach((warning: string) => {
        console.log(`      - ${warning}`);
      });
    }

    if (result.isValid && result.errors.length === 0 && result.warnings.length === 0) {
      console.log('\n   ✅ All checks passed');
    }
  }

  @Option({
    flags: '-s, --stage <stage>',
    description: 'Validation stage: pre, post, or both',
    defaultValue: 'both',
  })
  parseStage(value: string): 'pre' | 'post' | 'both' {
    if (!['pre', 'post', 'both'].includes(value)) {
      throw new Error('Stage must be: pre, post, or both');
    }
    return value as 'pre' | 'post' | 'both';
  }

  @Option({
    flags: '-r, --report',
    description: 'Generate detailed validation report',
  })
  parseReport(): boolean {
    return true;
  }

  @Option({
    flags: '-d, --detailed',
    description: 'Show detailed validation information',
  })
  parseDetailed(): boolean {
    return true;
  }
}