import { SpawnOptions } from 'child_process';
import { Logger } from '@nestjs/common';
export declare class ProcessError extends Error {
    readonly code: number;
    readonly command: string;
    constructor(message: string, code: number, command: string);
}
export interface ProcessExecutionOptions extends SpawnOptions {
    command: string;
    args: string[];
    logger?: Logger;
}
export declare function executeProcess(options: ProcessExecutionOptions): Promise<void>;
