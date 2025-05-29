//src/modules/auth/interfaces/jwt-payload.interface.ts
export interface JwtPayload {
  sub: string; // User ID
  email: string; // User email
  role: string; // User role
  tenantId: string | null; // Current active tenant
  tenantAccess: string[]; // List of accessible tenants
  sessionId: string; // Session ID
  type: 'access' | 'refresh'; // Token type
  iat?: number; // Issued at
  exp?: number; // Expiration
}
