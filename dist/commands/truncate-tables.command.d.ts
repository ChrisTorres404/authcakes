import { CommandRunner } from 'nest-commander';
import { DataSource } from 'typeorm';
interface TruncateTablesCommandOptions {
    tables?: string;
    all?: boolean;
    confirm?: boolean;
}
export declare class TruncateTablesCommand extends CommandRunner {
    private dataSource;
    private readonly logger;
    private readonly seedableTables;
    constructor(dataSource: DataSource);
    parseTablesOption(val: string): string;
    parseAllOption(val: boolean): boolean;
    parseConfirmOption(val: boolean): boolean;
    run(passedParams: string[], options: TruncateTablesCommandOptions): Promise<void>;
    private getExistingTables;
    private truncateTables;
    private printHelp;
}
export {};
