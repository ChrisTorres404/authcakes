import { CommandRunner } from 'nest-commander';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
export interface ResetDatabaseCommandOptions {
    confirm?: boolean;
    migrate?: boolean;
    seed?: boolean;
}
export declare class ResetDatabaseCommand extends CommandRunner {
    private dataSource;
    private configService;
    private readonly logger;
    constructor(dataSource: DataSource, configService: ConfigService);
    parseConfirmOption(val: boolean): boolean;
    parseMigrateOption(val: boolean): boolean;
    parseSeedOption(val: boolean): boolean;
    run(passedParams: string[], options: ResetDatabaseCommandOptions): Promise<void>;
}
