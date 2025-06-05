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
var SeedCommand_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedCommand = void 0;
const nest_commander_1 = require("nest-commander");
const common_1 = require("@nestjs/common");
const seeder_service_1 = require("../modules/database/seeds/seeder.service");
const database_types_1 = require("./types/database.types");
let SeedCommand = SeedCommand_1 = class SeedCommand extends nest_commander_1.CommandRunner {
    seederService;
    logger = new common_1.Logger(SeedCommand_1.name);
    constructor(seederService) {
        super();
        this.seederService = seederService;
    }
    parseForceOption(val) {
        return !!val;
    }
    parseEnvironmentOption(val) {
        return val;
    }
    async run(passedParams, options) {
        try {
            const environment = options.environment || process.env.NODE_ENV || 'development';
            this.logger.log(`Starting database seeding for ${environment} environment...`);
            const seederOptions = {
                force: options.force,
                environment: environment,
            };
            await this.seederService.seed(seederOptions);
            this.logger.log('Database seeding completed successfully!');
            process.exit(0);
        }
        catch (error) {
            const dbError = (0, database_types_1.isDatabaseError)(error)
                ? error
                : { message: 'Unknown error during seeding' };
            this.logger.error(`Error during database seeding: ${dbError.message}`, dbError.stack);
            process.exit(1);
        }
    }
};
exports.SeedCommand = SeedCommand;
__decorate([
    (0, nest_commander_1.Option)({
        flags: '-f, --force',
        description: 'Force seeding even if tables are not empty',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", Boolean)
], SeedCommand.prototype, "parseForceOption", null);
__decorate([
    (0, nest_commander_1.Option)({
        flags: '-e, --environment <environment>',
        description: 'Environment to seed for (development, test, production)',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", String)
], SeedCommand.prototype, "parseEnvironmentOption", null);
exports.SeedCommand = SeedCommand = SeedCommand_1 = __decorate([
    (0, nest_commander_1.Command)({ name: 'seed', description: 'Seed the database with initial data' }),
    __metadata("design:paramtypes", [seeder_service_1.SeederService])
], SeedCommand);
//# sourceMappingURL=seed.command.js.map