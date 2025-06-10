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
    poolSize: number;
    poolMaxConnections: number;
    poolIdleTimeout: number;
    poolAcquireTimeout: number;
    poolValidateConnection: boolean;
    retryAttempts: number;
    retryDelay: number;
    statementTimeout: number;
    queryTimeout: number;
}
declare const _default: (() => DatabaseConfig) & import("@nestjs/config").ConfigFactoryKeyHost<DatabaseConfig>;
export default _default;
