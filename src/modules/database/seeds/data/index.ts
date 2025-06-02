/**
 * @fileoverview Seed data configurations for all environments
 */

export * from './seed-config.interface';
export * from './development.seed-data';
export * from './test.seed-data';
export * from './production.seed-data';

import { developmentSeedData } from './development.seed-data';
import { testSeedData } from './test.seed-data';
import { productionSeedData } from './production.seed-data';
import { SeedDataConfig } from './seed-config.interface';

/**
 * Get seed data configuration for the specified environment
 * @param environment - Environment name
 * @returns Seed data configuration
 */
export function getSeedDataForEnvironment(
  environment: string = process.env.NODE_ENV || 'development',
): SeedDataConfig {
  switch (environment) {
    case 'test':
      return testSeedData;
    case 'production':
    case 'prod':
      return productionSeedData;
    case 'development':
    case 'dev':
    default:
      return developmentSeedData;
  }
}