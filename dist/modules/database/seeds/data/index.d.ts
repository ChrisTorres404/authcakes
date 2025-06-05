export * from './seed-config.interface';
export * from './development.seed-data';
export * from './test.seed-data';
export * from './production.seed-data';
import { SeedDataConfig } from './seed-config.interface';
export declare function getSeedDataForEnvironment(environment?: string): SeedDataConfig;
