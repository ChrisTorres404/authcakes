export declare class NotificationService {
    private readonly logger;
    sendPasswordResetSuccess(email: string): void;
    sendPasswordResetOtp(email: string, otp: string): void;
    sendAccountRecoveryEmail(email: string, token: string): void;
    sendGenericRecoveryAttemptEmail(email: string): void;
    sendRecoveryNotification(email: string, token?: string, accountExists?: boolean): void;
    sendAccountRecoverySuccess(email: string): void;
}
