"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDatabaseError = isDatabaseError;
exports.isSupportedDatabase = isSupportedDatabase;
function isDatabaseError(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string');
}
function isSupportedDatabase(type) {
    return ['postgres', 'mysql'].includes(type);
}
//# sourceMappingURL=database.types.js.map