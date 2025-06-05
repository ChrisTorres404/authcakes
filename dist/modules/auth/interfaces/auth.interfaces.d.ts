import { User } from '../../users/entities/user.entity';
export interface DeviceInfo {
    type?: string;
    platform?: string;
    browser?: string;
    version?: string;
    ip?: string;
    userAgent?: string;
    [key: string]: unknown;
}
export interface AuthCookieParams {
    accessToken: string;
    refreshToken: string;
    sessionId: string;
}
export interface AuthTokenResponse {
    success: boolean;
    user: Partial<User>;
    sessionId: string;
    accessToken: string;
    refreshToken: string;
    verificationToken?: string;
    passwordExpired?: boolean;
}
export interface MfaResponse {
    success: boolean;
    secret?: string;
    otpauth_url?: string;
    message?: string;
}
export interface AuditLogResponse {
    success: boolean;
    message: string;
}
