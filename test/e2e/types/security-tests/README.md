# Security Test Suite

This directory contains comprehensive security tests for the AuthCakes API, covering OWASP Top 10 vulnerabilities and enterprise security requirements.

## Test Coverage

### Authentication Security (`authentication.security.e2e-spec.ts`)
- **Brute Force Protection**: Rate limiting and account lockout
- **SQL Injection**: Input sanitization and parameterized queries
- **XSS Protection**: HTML/JavaScript injection prevention
- **JWT Security**: Token validation and expiration
- **Password Security**: Strong password requirements and timing attack prevention
- **Session Security**: Session management and fixation prevention
- **CSRF Protection**: Cross-site request forgery prevention
- **Security Headers**: HTTP security headers validation
- **Input Validation**: Strict input validation and sanitization

### Authorization Security (`authorization.security.e2e-spec.ts`)
- **RBAC**: Role-based access control enforcement
- **Tenant Isolation**: Multi-tenant data separation
- **API Key Security**: Secure API key management
- **Path Traversal**: Directory traversal prevention
- **IDOR Protection**: Insecure direct object reference prevention
- **Mass Assignment**: Protected field assignment prevention
- **Request Forgery**: CSRF and request validation
- **Information Disclosure**: Sensitive data leak prevention

## Running Security Tests

### Run All Security Tests
```bash
npm run test:e2e -- test/e2e/types/security-tests
```

### Run Specific Test Suite
```bash
# Authentication security tests
npm run test:e2e -- test/e2e/types/security-tests/authentication.security.e2e-spec.ts

# Authorization security tests
npm run test:e2e -- test/e2e/types/security-tests/authorization.security.e2e-spec.ts
```

### Run with Coverage
```bash
npm run test:e2e:cov -- test/e2e/types/security-tests
```

## OWASP ZAP Security Scanning

The project includes automated security scanning using OWASP ZAP.

### Prerequisites
- Docker must be installed and running
- API must be running (default: http://localhost:3000)

### Running Security Scans

```bash
# Run baseline scan (quick)
./scripts/security-scan.sh baseline

# Run API scan (requires OpenAPI spec)
./scripts/security-scan.sh api

# Run full scan (comprehensive, takes longer)
./scripts/security-scan.sh full

# Run all scans
./scripts/security-scan.sh all
```

### Scan Results
- Reports are saved in `security-reports/` directory
- Available formats: HTML, Markdown, JSON, XML
- Summary report includes vulnerability counts by severity

## Security Test Checklist

### OWASP Top 10 Coverage
- [x] A01:2021 – Broken Access Control
- [x] A02:2021 – Cryptographic Failures (JWT security)
- [x] A03:2021 – Injection (SQL, XSS)
- [x] A04:2021 – Insecure Design (secure by default)
- [x] A05:2021 – Security Misconfiguration (headers, CORS)
- [x] A06:2021 – Vulnerable Components (dependency scanning in CI)
- [x] A07:2021 – Authentication Failures (brute force, session)
- [x] A08:2021 – Integrity Failures (CSRF, validation)
- [x] A09:2021 – Logging Failures (covered in implementation)
- [x] A10:2021 – SSRF (input validation)

### Additional Security Tests
- [x] Rate limiting and DDoS protection
- [x] Multi-tenant isolation
- [x] API key management
- [x] Password policy enforcement
- [x] Session management
- [x] Input validation and sanitization

## Best Practices

1. **Run Before Each Release**: Execute full security test suite
2. **Continuous Monitoring**: Run baseline scans in CI/CD
3. **Regular Updates**: Keep security tests updated with new threats
4. **Fix High Severity**: Address all high-risk findings immediately
5. **Document Exceptions**: If a finding is accepted, document the risk

## Integration with CI/CD

Add to `.github/workflows/security.yml`:

```yaml
name: Security Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:e2e -- test/e2e/types/security-tests
      
  zap-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.9.0
        with:
          target: 'http://localhost:3000'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
```

## Troubleshooting

### Common Issues

1. **Rate Limit Tests Failing**
   - Ensure Redis is running for rate limiting
   - Check throttler configuration

2. **JWT Tests Failing**
   - Verify JWT_SECRET is set
   - Check token expiration settings

3. **OWASP ZAP Docker Issues**
   - Ensure Docker daemon is running
   - Check network connectivity

### Debug Mode

Run tests with debug output:
```bash
DEBUG=* npm run test:e2e -- test/e2e/types/security-tests
```

## Future Enhancements

1. **Penetration Testing**: Manual security assessment
2. **Fuzzing**: Input fuzzing for edge cases
3. **Performance Security**: DDoS and resource exhaustion
4. **Compliance Tests**: GDPR, HIPAA, SOC2 specific tests
5. **Security Benchmarking**: Track security metrics over time