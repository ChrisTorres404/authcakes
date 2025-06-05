export interface AuthConfig {
    jwt: {
        secret: string;
        refreshSecret?: string;
        accessExpiresIn: string;
        refreshExpiresIn: string;
    };
    password: {
        bcryptRounds: number;
        minLength: number;
        requireNumbers: boolean;
        requireSpecial: boolean;
    };
    mfa: {
        enabled: boolean;
        totpWindow: number;
    };
    cookies: {
        domain: string;
        secure: boolean;
        sameSite: string;
    };
    security: {
        maxFailedAttempts: number;
        lockDurationMinutes: number;
    };
}
declare const _default: (() => AuthConfig) & import("@nestjs/config").ConfigFactoryKeyHost<AuthConfig>;
export default _default;
