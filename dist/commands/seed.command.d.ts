import { CommandRunner } from 'nest-commander';
import { SeederService } from '../modules/database/seeds/seeder.service';
export declare class SeedCommand extends CommandRunner {
    private readonly seederService;
    private readonly logger;
    constructor(seederService: SeederService);
    run(): Promise<void>;
}
