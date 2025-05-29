"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessError = void 0;
exports.executeProcess = executeProcess;
const child_process_1 = require("child_process");
class ProcessError extends Error {
    code;
    command;
    constructor(message, code, command) {
        super(message);
        this.code = code;
        this.command = command;
        this.name = 'ProcessError';
    }
}
exports.ProcessError = ProcessError;
async function executeProcess(options) {
    const { command, args, logger, ...spawnOptions } = options;
    return new Promise((resolve, reject) => {
        const childProcess = (0, child_process_1.spawn)(command, args, {
            stdio: 'inherit',
            shell: true,
            ...spawnOptions,
        });
        childProcess.on('error', (error) => {
            logger?.error(`Process error: ${error.message}`);
            reject(new ProcessError(error.message, -1, command));
        });
        childProcess.on('close', (code) => {
            const exitCode = code ?? -1;
            if (exitCode === 0) {
                logger?.log(`Process completed successfully: ${command}`);
                resolve();
            }
            else {
                const message = `Process failed with exit code ${exitCode}: ${command}`;
                logger?.error(message);
                reject(new ProcessError(message, exitCode, command));
            }
        });
    });
}
//# sourceMappingURL=process.utils.js.map