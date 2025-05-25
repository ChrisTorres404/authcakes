export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    tenantId: string | null;
    tenantAccess: string[];
    sessionId: string;
    type: 'access' | 'refresh';
    iat?: number;
    exp?: number;
}
