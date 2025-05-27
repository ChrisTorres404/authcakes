"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nest_commander_1 = require("nest-commander");
const cli_module_1 = require("./cli.module");
const common_1 = require("@nestjs/common");
common_1.Logger.log('CLI bootstrap starting...');
async function bootstrap() {
    try {
        common_1.Logger.log('Attempting to initialize CommandFactory with CliModule...');
        console.log('Debug: Before CommandFactory.run()');
        const result = await nest_commander_1.CommandFactory.run(cli_module_1.CliModule, {
            logger: ['log', 'error', 'warn', 'debug', 'verbose'],
            cliName: 'authcakes-cli',
        });
        console.log('Debug: After CommandFactory.run()', result);
        common_1.Logger.log('CommandFactory.run() completed successfully');
    }
    catch (error) {
        common_1.Logger.error(`CLI Error: ${error.message}`, error.stack);
        console.error('Detailed error object:', error);
        process.exit(1);
    }
}
bootstrap().catch(err => {
    console.error('Unhandled bootstrap error:', err);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map