"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("./modules/database/database.module");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const seed_command_1 = require("./commands/seed.command");
const truncate_tables_command_1 = require("./commands/truncate-tables.command");
const reset_database_command_1 = require("./commands/reset-database.command");
const verify_db_connection_command_1 = require("./commands/verify-db-connection.command");
const app_config_1 = require("./config/app.config");
const auth_config_1 = require("./config/auth.config");
const database_config_1 = require("./config/database.config");
const throttler_config_1 = require("./config/throttler.config");
const validation_schema_1 = require("./config/validation.schema");
let CliModule = class CliModule {
};
exports.CliModule = CliModule;
exports.CliModule = CliModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [app_config_1.default, auth_config_1.default, database_config_1.default, throttler_config_1.default],
                validationSchema: validation_schema_1.validationSchema,
                validationOptions: {
                    allowUnknown: true,
                    abortEarly: true,
                },
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('database.host'),
                    port: configService.get('database.port'),
                    username: configService.get('database.username'),
                    password: configService.get('database.password'),
                    database: configService.get('database.name'),
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    synchronize: configService.get('database.synchronize'),
                    logging: configService.get('database.logging'),
                }),
            }),
            database_module_1.DatabaseModule,
        ],
        providers: [
            seed_command_1.SeedCommand,
            truncate_tables_command_1.TruncateTablesCommand,
            reset_database_command_1.ResetDatabaseCommand,
            verify_db_connection_command_1.VerifyDbConnectionCommand,
        ],
    })
], CliModule);
//# sourceMappingURL=cli.module.js.map