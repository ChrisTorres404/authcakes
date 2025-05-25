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
let SeedCommand = SeedCommand_1 = class SeedCommand extends nest_commander_1.CommandRunner {
    seederService;
    logger = new common_1.Logger(SeedCommand_1.name);
    constructor(seederService) {
        super();
        this.seederService = seederService;
        common_1.Logger.log('SeedCommand constructed');
    }
    async run() {
        this.logger.log('Starting database seeding...');
        try {
            await this.seederService.seed();
            this.logger.log('Database seeding completed successfully!');
            process.exit(0);
        }
        catch (error) {
            this.logger.error(`Error during database seeding: ${error.message}`, error.stack);
            process.exit(1);
        }
    }
};
exports.SeedCommand = SeedCommand;
exports.SeedCommand = SeedCommand = SeedCommand_1 = __decorate([
    (0, nest_commander_1.Command)({ name: 'seed', description: 'Seed the database with initial data' }),
    __metadata("design:paramtypes", [seeder_service_1.SeederService])
], SeedCommand);
//# sourceMappingURL=seed.command.js.map