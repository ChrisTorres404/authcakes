export declare class MfaEnrollResponseDto {
    secret: string;
    otpauth_url?: string;
    setupStatus: string;
}
export declare class MfaVerifyResponseDto {
    message?: string;
    recoveryCodes?: string[];
}
