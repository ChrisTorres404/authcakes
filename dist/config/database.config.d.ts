type SupportedDatabaseType = 'postgres' | 'mysql' | 'sqlite' | 'mariadb' | 'mongodb';
export interface DatabaseConfig {
    type: SupportedDatabaseType;
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
    synchronize: boolean;
    logging: boolean;
    ssl: boolean;
    migrationsRun: boolean;
}
declare const _default: (() => DatabaseConfig) & import("@nestjs/config").ConfigFactoryKeyHost<DatabaseConfig>;
export default _default;
