# Quick Start: Critical Security Fixes for AuthCakes API

## Immediate Actions Required (Day 1)

### 1. Fix JWT Secret (CRITICAL - 10 minutes)

```bash
# Generate a secure JWT secret
openssl rand -base64 64

# Add to .env file
JWT_SECRET=<your-generated-secret>
JWT_REFRESH_SECRET=<another-generated-secret>
```

Update `src/config/auth.config.ts`:
```typescript
export default registerAs('auth', () => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!jwtSecret || jwtSecret === 'changeme') {
    throw new Error('JWT_SECRET environment variable must be set with a secure value');
  }
  
  if (!jwtRefreshSecret) {
    throw new Error('JWT_REFRESH_SECRET environment variable must be set');
  }
  
  return {
    jwt: {
      secret: jwtSecret,
      refreshSecret: jwtRefreshSecret,
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '900',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '604800',
    },
    // ... rest of config
  };
});
```

### 2. Enable Security Headers (5 minutes)

Update `src/main.ts`:
```typescript
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Enable Helmet - UNCOMMENT THIS LINE
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // ... rest of bootstrap
}
```

### 3. Remove Sensitive Logging (30 minutes)

Run this script to find all sensitive logging:
```bash
#!/bin/bash
# find-sensitive-logs.sh

echo "Finding potential sensitive logging..."
grep -rn "console.log" src/ | grep -E "(password|token|secret|key|auth)" | grep -v ".spec.ts"

echo -e "\nFiles to review:"
grep -rl "console.log.*user\." src/ | grep -v ".spec.ts"
```

Remove these specific instances:
- `src/modules/auth/services/auth.service.ts` - Lines with user passwords
- `src/modules/auth/controllers/auth.controller.ts` - Lines with tokens
- `src/modules/auth/strategies/jwt.strategy.ts` - Lines with JWT payloads

### 4. Add CSRF Protection (15 minutes)

Install CSRF package:
```bash
npm install csurf @types/csurf
```

Create `src/common/middleware/csrf.middleware.ts`:
```typescript
import * as csurf from 'csurf';

export const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});
```

Update `src/main.ts`:
```typescript
import { csrfProtection } from './common/middleware/csrf.middleware';

async function bootstrap() {
  // ... existing code
  
  // Add CSRF protection for state-changing operations
  app.use('/api/auth/logout', csrfProtection);
  app.use('/api/auth/change-password', csrfProtection);
  app.use('/api/users', csrfProtection);
  app.use('/api/tenants', csrfProtection);
  
  // ... rest of bootstrap
}
```

### 5. Complete MFA Recovery Codes (30 minutes)

Update `src/modules/auth/controllers/auth.controller.ts`:
```typescript
@Post('mfa/verify')
@HttpCode(200)
async mfaVerify(
  @Req() req: RequestWithUser,
  @Body() verifyDto: { code: string; type?: 'totp' | 'recovery' },
): Promise<{ success: boolean; message?: string }> {
  const userId = req.user?.id || (req.user as any)?.sub;
  if (!userId) {
    return { success: false, message: 'User not authenticated' };
  }
  
  // Check if using recovery code
  if (verifyDto.type === 'recovery') {
    const isValid = await this.authService.verifyRecoveryCode(userId, verifyDto.code);
    if (isValid) {
      return { success: true };
    }
    return { success: false, message: 'Invalid recovery code' };
  }
  
  // Regular TOTP verification
  const user = await this.authService.getUserById(userId);
  const secret = user.mfaSecret;
  if (!secret) {
    return { success: false, message: 'MFA not configured' };
  }
  
  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: verifyDto.code,
    window: 1,
  });
  
  if (verified) {
    await this.authService.enableMfa(userId);
    return { success: true };
  }
  
  return { success: false, message: 'Invalid code' };
}
```

Add to `src/modules/auth/services/auth.service.ts`:
```typescript
async verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
  const user = await this.usersService.findById(userId, {
    relations: ['mfaRecoveryCodes'],
  });
  
  const recoveryCode = user.mfaRecoveryCodes?.find(
    rc => rc.code === code && !rc.used
  );
  
  if (!recoveryCode) {
    return false;
  }
  
  // Mark as used
  await this.usersService.markRecoveryCodeAsUsed(recoveryCode.id);
  
  // Check if all codes are used and regenerate if needed
  const unusedCodes = user.mfaRecoveryCodes.filter(rc => !rc.used);
  if (unusedCodes.length === 0) {
    await this.generateRecoveryCodes(userId);
  }
  
  return true;
}
```

## Environment Variables Template

Create/update `.env.production`:
```bash
# Security - REQUIRED
NODE_ENV=production
JWT_SECRET=<generate-with-openssl-rand-base64-64>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-64>
SESSION_SECRET=<generate-with-openssl-rand-base64-32>

# JWT Configuration
JWT_ACCESS_EXPIRES_IN=900      # 15 minutes
JWT_REFRESH_EXPIRES_IN=604800   # 7 days

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/authcakes
DATABASE_SSL=true

# Redis (for production rate limiting)
REDIS_URL=redis://:password@localhost:6379
REDIS_TLS=true

# CORS (update with your domains)
CORS_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com

# Rate Limiting
THROTTLE_LIMIT=100
THROTTLE_TTL=60

# MFA
MFA_ISSUER=AuthCakes
```

## Verification Commands

After implementing fixes, run these commands:

```bash
# 1. Check for hardcoded secrets
grep -r "changeme\|default\|password123" src/

# 2. Verify helmet is enabled
grep "app.use(helmet" src/main.ts

# 3. Check for console.log with sensitive data
npm run lint

# 4. Run security tests
npm run test:e2e

# 5. Check environment variables
node -e "console.log('JWT_SECRET set:', !!process.env.JWT_SECRET && process.env.JWT_SECRET !== 'changeme')"
```

## Next Steps

After completing these critical fixes:

1. **Deploy immediately** to prevent exploitation
2. **Rotate all existing tokens** - force users to re-authenticate
3. **Audit logs** for any suspicious activity
4. **Begin Phase 1** of the full Zero Trust implementation

## Emergency Contacts

If you discover active exploitation:
1. Disable affected endpoints immediately
2. Rotate all secrets
3. Review audit logs for compromise indicators
4. Notify users if data was accessed

---
*These fixes address the most critical vulnerabilities and can be implemented in under 2 hours.*