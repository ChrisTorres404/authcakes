"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ResetDatabaseCommand_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetDatabaseCommand = void 0;
const nest_commander_1 = require("nest-commander");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
let ResetDatabaseCommand = ResetDatabaseCommand_1 = class ResetDatabaseCommand extends nest_commander_1.CommandRunner {
    dataSource;
    configService;
    logger = new common_1.Logger(ResetDatabaseCommand_1.name);
    constructor(dataSource, configService) {
        super();
        this.dataSource = dataSource;
        this.configService = configService;
    }
    parseConfirmOption(val) {
        return !!val;
    }
    parseMigrateOption(val) {
        return !!val;
    }
    parseSeedOption(val) {
        return !!val;
    }
    async run(passedParams, options) {
        try {
            const dbName = this.configService.get('DB_NAME');
            const dbType = this.configService.get('DB_TYPE');
            if (!options.confirm) {
                this.logger.warn(`⚠️ WARNING: This operation will COMPLETELY RESET the "${dbName}" database, DELETING ALL DATA. ⚠️`);
                this.logger.warn('Use --confirm to bypass this warning and proceed with the operation.');
                this.logger.log('');
                this.logger.log('Usage:');
                this.logger.log('  db:reset --confirm [--migrate] [--seed]');
                process.exit(0);
            }
            this.logger.log(`Resetting database "${dbName}"...`);
            const connectionOptions = {
                host: this.configService.get('DB_HOST'),
                port: this.configService.get('DB_PORT'),
                username: this.configService.get('DB_USERNAME'),
                password: this.configService.get('DB_PASSWORD'),
            };
            await this.dataSource.destroy();
            this.logger.log('Database connection closed');
            const defaultDbName = dbType === 'postgres' ? 'postgres' : dbName;
            let masterConnection;
            if (dbType === 'postgres') {
                masterConnection = new typeorm_2.DataSource({
                    type: 'postgres',
                    host: connectionOptions.host,
                    port: connectionOptions.port,
                    username: connectionOptions.username,
                    password: connectionOptions.password,
                    database: defaultDbName,
                });
            }
            else if (dbType === 'mysql') {
                masterConnection = new typeorm_2.DataSource({
                    type: 'mysql',
                    host: connectionOptions.host,
                    port: connectionOptions.port,
                    username: connectionOptions.username,
                    password: connectionOptions.password,
                });
            }
            else {
                throw new Error(`Unsupported database type: ${dbType}`);
            }
            await masterConnection.initialize();
            this.logger.log(`Connected to ${dbType} server`);
            try {
                if (dbType === 'postgres') {
                    await masterConnection.query(`SELECT pg_terminate_backend(pg_stat_activity.pid) 
             FROM pg_stat_activity 
             WHERE pg_stat_activity.datname = '${dbName}' 
             AND pid <> pg_backend_pid()`);
                    await masterConnection.query(`DROP DATABASE IF EXISTS "${dbName}"`);
                }
                else if (dbType === 'mysql') {
                    await masterConnection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
                }
                this.logger.log(`Database "${dbName}" dropped`);
            }
            catch (error) {
                this.logger.error(`Error dropping database: ${error.message}`);
                throw error;
            }
            try {
                if (dbType === 'postgres') {
                    await masterConnection.query(`CREATE DATABASE "${dbName}"`);
                }
                else if (dbType === 'mysql') {
                    await masterConnection.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
                }
                this.logger.log(`Database "${dbName}" created`);
            }
            catch (error) {
                this.logger.error(`Error creating database: ${error.message}`);
                throw error;
            }
            await masterConnection.destroy();
            this.logger.log('Database reset completed successfully');
            if (options.migrate) {
                this.logger.log('Running migrations...');
                const { spawn } = require('child_process');
                const migrateProcess = spawn('npm', ['run', 'migration:run'], {
                    stdio: 'inherit',
                    shell: true,
                });
                await new Promise((resolve, reject) => {
                    migrateProcess.on('close', (code) => {
                        if (code === 0) {
                            this.logger.log('Migrations completed successfully');
                            resolve();
                        }
                        else {
                            this.logger.error(`Migrations failed with exit code ${code}`);
                            reject(new Error(`Migrations failed with exit code ${code}`));
                        }
                    });
                });
            }
            if (options.seed) {
                if (!options.migrate) {
                    this.logger.warn('Running seeders without migrations may cause errors if tables do not exist');
                }
                this.logger.log('Running seeders...');
                const { spawn } = require('child_process');
                const seedProcess = spawn('npm', ['run', 'seed'], {
                    stdio: 'inherit',
                    shell: true,
                });
                await new Promise((resolve, reject) => {
                    seedProcess.on('close', (code) => {
                        if (code === 0) {
                            this.logger.log('Seeding completed successfully');
                            resolve();
                        }
                        else {
                            this.logger.error(`Seeding failed with exit code ${code}`);
                            reject(new Error(`Seeding failed with exit code ${code}`));
                        }
                    });
                });
            }
            this.logger.log('Database reset process completed');
            process.exit(0);
        }
        catch (error) {
            this.logger.error(`Error resetting database: ${error.message}`, error.stack);
            process.exit(1);
        }
    }
};
exports.ResetDatabaseCommand = ResetDatabaseCommand;
__decorate([
    (0, nest_commander_1.Option)({
        flags: '-y, --confirm',
        description: 'Confirm database reset without prompt',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", Boolean)
], ResetDatabaseCommand.prototype, "parseConfirmOption", null);
__decorate([
    (0, nest_commander_1.Option)({
        flags: '-m, --migrate',
        description: 'Run migrations after reset',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", Boolean)
], ResetDatabaseCommand.prototype, "parseMigrateOption", null);
__decorate([
    (0, nest_commander_1.Option)({
        flags: '-s, --seed',
        description: 'Run seeders after reset and migrations',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", Boolean)
], ResetDatabaseCommand.prototype, "parseSeedOption", null);
exports.ResetDatabaseCommand = ResetDatabaseCommand = ResetDatabaseCommand_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, nest_commander_1.Command)({
        name: 'db:reset',
        description: 'Reset the entire database (drop and recreate)',
    }),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        config_1.ConfigService])
], ResetDatabaseCommand);
//# sourceMappingURL=reset-database.command.js.map