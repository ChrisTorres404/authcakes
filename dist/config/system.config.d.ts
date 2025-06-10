export interface SystemConfig {
    apiKeys: string[];
    jwtSecret: string;
    jwtIssuer: string;
    jwtAudience: string;
    jwtExpirationMinutes: number;
    activeClients: string[];
    requireSystemAuth: boolean;
}
declare const _default: (() => SystemConfig) & import("@nestjs/config").ConfigFactoryKeyHost<SystemConfig>;
export default _default;
