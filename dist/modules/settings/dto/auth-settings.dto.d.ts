export declare class AuthSettingsDto {
    enableEmailAuth: boolean;
    enableSmsAuth: boolean;
    enableGoogleAuth: boolean;
    enableAppleAuth: boolean;
    enableMfa: boolean;
    enableWebauthn: boolean;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumber: boolean;
    passwordRequireSpecial: boolean;
    maxLoginAttempts: number;
    loginLockoutDuration: number;
}
