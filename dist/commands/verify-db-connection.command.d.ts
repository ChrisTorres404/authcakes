import { CommandRunner } from 'nest-commander';
import { ConfigService } from '@nestjs/config';
export declare class VerifyDbConnectionCommand extends CommandRunner {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    run(): Promise<void>;
}
