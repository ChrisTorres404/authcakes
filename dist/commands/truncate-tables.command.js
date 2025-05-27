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
var TruncateTablesCommand_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TruncateTablesCommand = void 0;
const nest_commander_1 = require("nest-commander");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let TruncateTablesCommand = TruncateTablesCommand_1 = class TruncateTablesCommand extends nest_commander_1.CommandRunner {
    dataSource;
    logger = new common_1.Logger(TruncateTablesCommand_1.name);
    seedableTables = [
        'users',
        'tenants',
        'tenant_memberships',
        'logs',
        'api_keys',
        'mfa_recovery_codes',
        'webauthn_credentials',
        'user_devices',
        'tenant_invitations',
        'system_settings',
    ];
    constructor(dataSource) {
        super();
        this.dataSource = dataSource;
    }
    parseTablesOption(val) {
        return val;
    }
    parseAllOption(val) {
        return !!val;
    }
    parseConfirmOption(val) {
        return !!val;
    }
    async run(passedParams, options) {
        try {
            let tablesToTruncate = [];
            if (options.all) {
                tablesToTruncate = [...this.seedableTables];
                this.logger.log(`Preparing to truncate all seedable tables: ${tablesToTruncate.join(', ')}`);
            }
            else if (options.tables) {
                tablesToTruncate = options.tables.split(',').map(t => t.trim());
                this.logger.log(`Preparing to truncate tables: ${tablesToTruncate.join(', ')}`);
            }
            else {
                this.logger.error('No tables specified. Use --tables or --all option.');
                this.printHelp();
                process.exit(1);
            }
            const existingTables = await this.getExistingTables();
            const nonExistentTables = tablesToTruncate.filter(table => !existingTables.includes(table));
            if (nonExistentTables.length > 0) {
                this.logger.error(`The following tables do not exist: ${nonExistentTables.join(', ')}`);
                process.exit(1);
            }
            if (!options.confirm) {
                this.logger.warn('This operation will DELETE ALL DATA in the specified tables. Use --confirm to bypass this warning.');
                process.exit(0);
            }
            await this.truncateTables(tablesToTruncate);
            this.logger.log('Tables truncated successfully. You can now run the seed command.');
            process.exit(0);
        }
        catch (error) {
            this.logger.error(`Error truncating tables: ${error.message}`, error.stack);
            process.exit(1);
        }
    }
    async getExistingTables() {
        const query = this.dataSource.createQueryRunner();
        const tables = await query.getTables();
        await query.release();
        return tables.map(table => table.name);
    }
    async truncateTables(tables) {
        const queryRunner = this.dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();
            if (this.dataSource.options.type === 'postgres') {
                await queryRunner.query('SET CONSTRAINTS ALL DEFERRED');
            }
            else if (this.dataSource.options.type === 'mysql') {
                await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
            }
            for (const table of tables) {
                this.logger.log(`Truncating table: ${table}`);
                await queryRunner.query(`TRUNCATE TABLE "${table}" CASCADE`);
            }
            if (this.dataSource.options.type === 'postgres') {
                await queryRunner.query('SET CONSTRAINTS ALL IMMEDIATE');
            }
            else if (this.dataSource.options.type === 'mysql') {
                await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
            }
            await queryRunner.commitTransaction();
            this.logger.log('All tables truncated successfully');
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    printHelp() {
        this.logger.log('Usage:');
        this.logger.log('  db:truncate --tables table1,table2,table3 --confirm');
        this.logger.log('  db:truncate --all --confirm');
        this.logger.log('\nAvailable seedable tables:');
        this.logger.log(`  ${this.seedableTables.join(', ')}`);
    }
};
exports.TruncateTablesCommand = TruncateTablesCommand;
__decorate([
    (0, nest_commander_1.Option)({
        flags: '-t, --tables [tables]',
        description: 'Comma-separated list of tables to truncate',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", String)
], TruncateTablesCommand.prototype, "parseTablesOption", null);
__decorate([
    (0, nest_commander_1.Option)({
        flags: '-a, --all',
        description: 'Truncate all seedable tables',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", Boolean)
], TruncateTablesCommand.prototype, "parseAllOption", null);
__decorate([
    (0, nest_commander_1.Option)({
        flags: '-y, --confirm',
        description: 'Confirm truncation without prompt',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", Boolean)
], TruncateTablesCommand.prototype, "parseConfirmOption", null);
exports.TruncateTablesCommand = TruncateTablesCommand = TruncateTablesCommand_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, nest_commander_1.Command)({
        name: 'db:truncate',
        description: 'Truncate specific tables to allow re-seeding',
    }),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], TruncateTablesCommand);
//# sourceMappingURL=truncate-tables.command.js.map