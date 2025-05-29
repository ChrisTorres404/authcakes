/**
 * Common database-related types used across CLI commands
 */

/** Database error structure for consistent error handling */
export interface DatabaseError {
  message: string;
  code?: string;
  stack?: string;
}

/** Type guard to check if an error is a DatabaseError */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as DatabaseError).message === 'string'
  );
}

/** Supported database types */
export type SupportedDatabase = 'postgres' | 'mysql';

/** Database configuration structure */
export interface DatabaseConfig {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

/** Type guard to check if database type is supported */
export function isSupportedDatabase(type: string): type is SupportedDatabase {
  return ['postgres', 'mysql'].includes(type);
}
