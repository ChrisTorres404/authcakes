interface NotificationOptions {
    email: string;
    token?: string;
    otp?: string;
    accountExists?: boolean;
}
export declare class NotificationService {
    private readonly logger;
    sendPasswordResetSuccess(email: string): void;
    sendPasswordResetOtp(email: string, otp: string): void;
    sendAccountRecoveryEmail(email: string, token: string): void;
    sendGenericRecoveryAttemptEmail(email: string): void;
    sendRecoveryNotification(options: NotificationOptions): void;
    sendAccountRecoverySuccess(email: string): void;
}
export {};
