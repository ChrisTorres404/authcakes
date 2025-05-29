"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const seeder_service_1 = require("./modules/database/seeds/seeder.service");
async function bootstrap() {
    common_1.Logger.log('Starting database seeding script...');
    try {
        const appContext = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
        const seederService = appContext.get(seeder_service_1.SeederService);
        common_1.Logger.log('Running database seed operations...');
        await seederService.seed();
        common_1.Logger.log('Database seeding completed successfully!');
        await appContext.close();
        process.exit(0);
    }
    catch (error) {
        if (error instanceof Error) {
            common_1.Logger.error(`Error during database seeding: ${error.message}`, error.stack);
        }
        else {
            common_1.Logger.error('Unknown error during database seeding');
        }
        process.exit(1);
    }
}
bootstrap().catch((error) => {
    common_1.Logger.error('Bootstrap failed', error);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map