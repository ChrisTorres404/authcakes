"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
let NotificationService = NotificationService_1 = class NotificationService {
    logger = new common_1.Logger(NotificationService_1.name);
    sendPasswordResetSuccess(email) {
        this.logger.log(`Password reset success notification sent to: ${email}`);
    }
    sendPasswordResetOtp(email, otp) {
        this.logger.log(`Password reset OTP sent to: ${email} (OTP: ${otp})`);
    }
    sendAccountRecoveryEmail(email, token) {
        this.logger.log(`Account recovery link sent to: ${email} (Token: ${token})`);
    }
    sendGenericRecoveryAttemptEmail(email) {
        this.logger.log(`Generic recovery attempt notification sent to: ${email}`);
    }
    sendRecoveryNotification(options) {
        const { email, token, accountExists = false } = options;
        if (accountExists && token) {
            this.sendAccountRecoveryEmail(email, token);
        }
        else {
            this.sendGenericRecoveryAttemptEmail(email);
        }
        this.logger.log(`Recovery notification sent to ${email} (account exists: ${accountExists})`);
    }
    sendAccountRecoverySuccess(email) {
        this.logger.log(`Account recovery success notification sent to: ${email}`);
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)()
], NotificationService);
//# sourceMappingURL=notification.service.js.map