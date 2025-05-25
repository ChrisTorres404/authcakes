export interface AppConfig {
    port: number;
    environment: string;
    corsOrigins: string[];
    baseUrl: string;
}
declare const _default: (() => AppConfig) & import("@nestjs/config").ConfigFactoryKeyHost<AppConfig>;
export default _default;
