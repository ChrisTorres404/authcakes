"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSeedDataForEnvironment = getSeedDataForEnvironment;
__exportStar(require("./seed-config.interface"), exports);
__exportStar(require("./development.seed-data"), exports);
__exportStar(require("./test.seed-data"), exports);
__exportStar(require("./production.seed-data"), exports);
const development_seed_data_1 = require("./development.seed-data");
const test_seed_data_1 = require("./test.seed-data");
const production_seed_data_1 = require("./production.seed-data");
function getSeedDataForEnvironment(environment = process.env.NODE_ENV || 'development') {
    switch (environment) {
        case 'test':
            return test_seed_data_1.testSeedData;
        case 'production':
        case 'prod':
            return production_seed_data_1.productionSeedData;
        case 'development':
        case 'dev':
        default:
            return development_seed_data_1.developmentSeedData;
    }
}
//# sourceMappingURL=index.js.map