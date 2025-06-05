import { CommandRunner } from 'nest-commander';
import { SeederService } from '../modules/database/seeds/seeder.service';
export interface SeedCommandOptions {
    force?: boolean;
    environment?: string;
}
export declare class SeedCommand extends CommandRunner {
    private readonly seederService;
    private readonly logger;
    constructor(seederService: SeederService);
    parseForceOption(val: boolean): boolean;
    parseEnvironmentOption(val: string): string;
    run(passedParams: string[], options: SeedCommandOptions): Promise<void>;
}
