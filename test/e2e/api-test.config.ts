/**
 * @fileoverview Configuration for API-based E2E tests
 * 
 * This configuration allows tests to run against different environments
 * without any code changes. Simply set environment variables to test
 * against staging, production, or local environments.
 */

export interface ApiTestConfig {
  /**
   * Base URL of the API
   * @example 'http://localhost:3030', 'https://api.staging.authcakes.com'
   */
  baseUrl: string;
  
  /**
   * API prefix path
   * @example '/api', '/v1', '/api/v2'
   */
  apiPrefix: string;
  
  /**
   * Request timeout in milliseconds
   */
  timeout: number;
  
  /**
   * Whether to log detailed request/response info
   */
  debug: boolean;
  
  /**
   * Optional API key for environments that require it
   */
  apiKey?: string;
  
  /**
   * Additional headers to include in all requests
   */
  defaultHeaders?: Record<string, string>;
}

/**
 * Get API test configuration from environment variables
 */
export function getApiTestConfig(): ApiTestConfig {
  return {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3030',
    apiPrefix: process.env.API_PREFIX || '/api',
    timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
    debug: process.env.API_DEBUG === 'true',
    apiKey: process.env.API_KEY,
    defaultHeaders: process.env.API_HEADERS 
      ? JSON.parse(process.env.API_HEADERS)
      : undefined,
  };
}

/**
 * Common test data generators
 */
export const TestDataGenerators = {
  /**
   * Generate a unique email address
   */
  uniqueEmail(prefix = 'test'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    return `${prefix}+${timestamp}${random}@example.com`;
  },

  /**
   * Generate a unique organization name
   */
  uniqueOrgName(prefix = 'TestOrg'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 5);
    return `${prefix}${timestamp}${random}`;
  },

  /**
   * Generate a strong password that meets common requirements
   */
  strongPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure it has at least one of each required character type
    return 'Aa1!' + password;
  },

  /**
   * Generate test user data
   */
  testUser(overrides?: Partial<any>) {
    return {
      email: this.uniqueEmail(),
      password: this.strongPassword(),
      firstName: 'Test',
      lastName: 'User',
      organizationName: this.uniqueOrgName(),
      ...overrides,
    };
  },
};

/**
 * API response validators
 */
export const ResponseValidators = {
  /**
   * Validate JWT token format
   */
  isValidJWT(token: string): boolean {
    const jwtRegex = /^[\w-]+\.[\w-]+\.[\w-]+$/;
    return jwtRegex.test(token);
  },

  /**
   * Validate error response structure
   */
  isValidErrorResponse(response: any): boolean {
    return (
      response &&
      typeof response.statusCode === 'number' &&
      typeof response.message === 'string' &&
      typeof response.error === 'string' &&
      typeof response.timestamp === 'string' &&
      typeof response.path === 'string'
    );
  },

  /**
   * Check if response contains sensitive information
   */
  containsSensitiveInfo(response: any): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /key/i,
      /sql/i,
      /database/i,
      /stack/i,
      /trace/i,
    ];

    const responseStr = JSON.stringify(response);
    return sensitivePatterns.some(pattern => pattern.test(responseStr));
  },
};