# Integration Tests

This directory contains integration tests that verify complete workflows and interactions between multiple modules in the AuthCakes API.

## Test Suites

### Authentication Workflow (`auth-workflow.integration.spec.ts`)
Tests the complete authentication flow including:
- User registration
- Login/logout
- Token refresh
- Password changes
- Session management
- Error handling
- Token security

### Tenant Workflow (`tenant-workflow.integration.spec.ts`)
Tests multi-tenant functionality including:
- Tenant creation and management
- Member management (add, update, remove)
- Invitation system
- Access control and isolation
- Role-based permissions
- Error scenarios

## Running Integration Tests

### Run All Integration Tests
```bash
npm run test:e2e test/integration
```

### Run Specific Test Suite
```bash
# Authentication tests
npm run test:e2e test/integration/auth-workflow.integration.spec.ts

# Tenant tests
npm run test:e2e test/integration/tenant-workflow.integration.spec.ts
```

### Run with Coverage
```bash
npm run test:e2e:cov test/integration
```

### Debug Mode
```bash
DEBUG=* npm run test:e2e test/integration
```

## Test Environment

Integration tests use a real database connection and the full application context. They:
- Start the complete NestJS application
- Use a test database (should be configured in `.env.test`)
- Clean data between tests
- Test real HTTP requests through the API

## Best Practices

1. **Data Isolation**: Each test suite cleans the database before tests
2. **User Setup**: Common users are created in `beforeEach` for consistency
3. **Token Management**: Tests manage authentication tokens for different users
4. **Error Testing**: Both success and error paths are tested
5. **Real Workflows**: Tests follow realistic user journeys

## Test Structure

```typescript
describe('Feature Workflow', () => {
  // Setup
  beforeAll(async () => {
    // Initialize app
  });

  beforeEach(async () => {
    // Clean database
    // Create test users
  });

  describe('Complete Flow', () => {
    it('should handle end-to-end workflow', async () => {
      // Step-by-step workflow testing
    });
  });

  describe('Error Scenarios', () => {
    it('should handle errors gracefully', async () => {
      // Test error conditions
    });
  });
});
```

## Adding New Integration Tests

1. Create a new file: `test/integration/[feature]-workflow.integration.spec.ts`
2. Import necessary modules and entities
3. Set up test data in `beforeEach`
4. Write tests that cover complete workflows
5. Test both success and error scenarios
6. Clean up data properly

## Common Patterns

### Creating Test Users
```typescript
const userData = {
  email: faker.internet.email().toLowerCase(),
  password: 'ValidPassword123!',
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
};

const response = await request(app.getHttpServer())
  .post('/api/v1/auth/register')
  .send(userData);

const token = response.body.data.accessToken;
```

### Making Authenticated Requests
```typescript
await request(app.getHttpServer())
  .get('/api/v1/users/profile')
  .set('Authorization', `Bearer ${token}`)
  .expect(200);
```

### Verifying Database State
```typescript
const user = await userRepository.findOne({
  where: { email: userData.email }
});
expect(user).toBeDefined();
expect(user.isEmailVerified).toBe(false);
```

## Troubleshooting

### Database Connection Issues
- Ensure test database exists
- Check `.env.test` configuration
- Verify PostgreSQL is running

### Test Timeouts
- Increase Jest timeout for slow operations:
  ```typescript
  jest.setTimeout(30000); // 30 seconds
  ```

### Data Conflicts
- Ensure proper cleanup in `beforeEach`
- Use unique data (faker) for each test
- Check for cascade delete constraints

### Authentication Failures
- Verify tokens are properly extracted
- Check token expiration settings
- Ensure proper user setup