export interface DatabaseError {
    message: string;
    code?: string;
    stack?: string;
}
export declare function isDatabaseError(error: unknown): error is DatabaseError;
export type SupportedDatabase = 'postgres' | 'mysql';
export interface DatabaseConfig {
    type: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
}
export declare function isSupportedDatabase(type: string): type is SupportedDatabase;
