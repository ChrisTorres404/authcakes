"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nest_commander_1 = require("nest-commander");
const cli_module_1 = require("./cli.module");
const common_1 = require("@nestjs/common");
common_1.Logger.log('CLI bootstrap starting...');
async function bootstrap() {
    try {
        await nest_commander_1.CommandFactory.run(cli_module_1.CliModule);
    }
    catch (error) {
        common_1.Logger.error('CLI Error:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=cli.js.map