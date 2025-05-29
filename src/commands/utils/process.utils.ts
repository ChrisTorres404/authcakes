/**
 * Utilities for handling child processes in CLI commands
 */

import { SpawnOptions, spawn } from 'child_process';
import { Logger } from '@nestjs/common';

/** Process execution error */
export class ProcessError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly command: string,
  ) {
    super(message);
    this.name = 'ProcessError';
  }
}

/** Process execution options */
export interface ProcessExecutionOptions extends SpawnOptions {
  /** Command to execute */
  command: string;
  /** Command arguments */
  args: string[];
  /** Optional logger instance */
  logger?: Logger;
}

/**
 * Executes a command in a child process and returns a promise
 *
 * @param options Process execution options
 * @returns Promise that resolves when the process completes successfully
 * @throws {ProcessError} If the process exits with a non-zero code
 *
 * @example
 * ```typescript
 * await executeProcess({
 *   command: 'npm',
 *   args: ['run', 'migration:run'],
 *   logger: new Logger('Migrations'),
 * });
 * ```
 */
export async function executeProcess(
  options: ProcessExecutionOptions,
): Promise<void> {
  const { command, args, logger, ...spawnOptions } = options;

  return new Promise<void>((resolve, reject) => {
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...spawnOptions,
    });

    childProcess.on('error', (error: Error) => {
      logger?.error(`Process error: ${error.message}`);
      reject(new ProcessError(error.message, -1, command));
    });

    childProcess.on('close', (code: number | null) => {
      const exitCode = code ?? -1;
      if (exitCode === 0) {
        logger?.log(`Process completed successfully: ${command}`);
        resolve();
      } else {
        const message = `Process failed with exit code ${exitCode}: ${command}`;
        logger?.error(message);
        reject(new ProcessError(message, exitCode, command));
      }
    });
  });
}
