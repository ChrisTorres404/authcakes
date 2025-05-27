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
var VerifyDbConnectionCommand_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyDbConnectionCommand = void 0;
const nest_commander_1 = require("nest-commander");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const config_1 = require("@nestjs/config");
let VerifyDbConnectionCommand = VerifyDbConnectionCommand_1 = class VerifyDbConnectionCommand extends nest_commander_1.CommandRunner {
    configService;
    logger = new common_1.Logger(VerifyDbConnectionCommand_1.name);
    constructor(configService) {
        super();
        this.configService = configService;
    }
    async run() {
        try {
            this.logger.log('Verifying database connection...');
            const dbConfig = {
                type: this.configService.get('DB_TYPE'),
                host: this.configService.get('DB_HOST'),
                port: this.configService.get('DB_PORT'),
                username: this.configService.get('DB_USERNAME'),
                password: this.configService.get('DB_PASSWORD'),
                database: this.configService.get('DB_NAME'),
            };
            const missingVars = Object.entries(dbConfig)
                .filter(([_, value]) => !value)
                .map(([key]) => key);
            if (missingVars.length > 0) {
                this.logger.error(`Missing required database configuration: ${missingVars.join(', ')}`);
                this.logger.error('Please check your .env file and ensure all required variables are set');
                process.exit(1);
            }
            this.logger.log('Database configuration is valid. Attempting connection...');
            const dataSource = new typeorm_1.DataSource({
                type: dbConfig.type,
                host: dbConfig.host,
                port: dbConfig.port,
                username: dbConfig.username,
                password: dbConfig.password,
                database: dbConfig.database,
            });
            await dataSource.initialize();
            this.logger.log('✅ Database connection successful!');
            const queryRunner = dataSource.createQueryRunner();
            const tables = await queryRunner.getTables();
            await queryRunner.release();
            const tableNames = tables.map(t => t.name).join(', ');
            if (tables.length === 0) {
                this.logger.warn('No tables found in the database. You may need to run migrations.');
            }
            else {
                this.logger.log(`Found ${tables.length} tables: ${tableNames}`);
                const requiredTables = ['users', 'tenants', 'system_settings'];
                const missingTables = requiredTables.filter(table => !tables.some(t => t.name === table));
                if (missingTables.length > 0) {
                    this.logger.warn(`Missing key tables: ${missingTables.join(', ')}. You may need to run migrations.`);
                }
                else {
                    this.logger.log('All key tables are present.');
                    for (const tableName of requiredTables) {
                        const count = await dataSource.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
                        const recordCount = parseInt(count[0].count, 10);
                        if (recordCount === 0) {
                            this.logger.warn(`Table '${tableName}' exists but has no data. You may need to run seeders.`);
                        }
                        else {
                            this.logger.log(`Table '${tableName}' has ${recordCount} records.`);
                        }
                    }
                }
            }
            await dataSource.destroy();
            this.logger.log('Database verification completed');
            process.exit(0);
        }
        catch (error) {
            this.logger.error(`Database connection failed: ${error.message}`);
            this.logger.error('Please check your database configuration and ensure the database is running');
            if (error.code === 'ECONNREFUSED') {
                this.logger.error(`Could not connect to database at ${this.configService.get('DB_HOST')}:${this.configService.get('DB_PORT')}`);
                this.logger.error('Make sure your database server is running and accessible');
            }
            else if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === '28P01') {
                this.logger.error('Access denied. Check your DB_USERNAME and DB_PASSWORD');
            }
            else if (error.code === 'ER_BAD_DB_ERROR' || error.code === '3D000') {
                this.logger.error(`Database '${this.configService.get('DB_NAME')}' does not exist`);
                this.logger.error('You may need to create the database first');
            }
            process.exit(1);
        }
    }
};
exports.VerifyDbConnectionCommand = VerifyDbConnectionCommand;
exports.VerifyDbConnectionCommand = VerifyDbConnectionCommand = VerifyDbConnectionCommand_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, nest_commander_1.Command)({
        name: 'db:verify',
        description: 'Verify database connection before migrations/seeding',
    }),
    __metadata("design:paramtypes", [config_1.ConfigService])
], VerifyDbConnectionCommand);
//# sourceMappingURL=verify-db-connection.command.js.map