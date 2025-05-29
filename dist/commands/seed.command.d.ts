import { CommandRunner } from 'nest-commander';
import { SeederService } from '../modules/database/seeds/seeder.service';
export interface SeedCommandOptions {
    force?: boolean;
}
export declare class SeedCommand extends CommandRunner {
    private readonly seederService;
    private readonly logger;
    constructor(seederService: SeederService);
    parseForceOption(val: boolean): boolean;
    run(passedParams: string[], options: SeedCommandOptions): Promise<void>;
}
