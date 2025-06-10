# Database Connection Pooling Configuration

This document describes the database connection pooling configuration implemented in the AuthCakes API to ensure optimal performance and reliability under load.

## Overview

Connection pooling is essential for production applications to:
- Reduce connection overhead by reusing existing connections
- Prevent database connection exhaustion
- Improve response times by eliminating connection setup latency
- Handle concurrent requests efficiently

## Configuration

### Environment Variables

The following environment variables control connection pooling behavior:

```bash
# Pool Size Configuration
DB_POOL_MIN=2                      # Minimum connections in pool (default: 2)
DB_POOL_MAX=20                     # Maximum connections in pool (default: 20)
DB_POOL_SIZE=20                    # Base pool size (default: 20)

# Connection Timeout Settings
DB_POOL_IDLE_TIMEOUT=10000         # Idle connection timeout in ms (default: 10s)
DB_POOL_ACQUIRE_TIMEOUT=60000      # Connection acquire timeout in ms (default: 60s)
DB_POOL_CREATE_TIMEOUT=30000       # Connection creation timeout in ms (default: 30s)

# Connection Validation
DB_POOL_VALIDATE=true              # Validate connections before use (default: true)

# Query Timeout Settings
DB_STATEMENT_TIMEOUT=30000         # Statement timeout in ms (default: 30s)
DB_QUERY_TIMEOUT=30000             # Query timeout in ms (default: 30s)

# Connection Retry Configuration
DB_RETRY_ATTEMPTS=10               # Number of retry attempts (default: 10)
DB_RETRY_DELAY=3000                # Delay between retries in ms (default: 3s)

# SSL Configuration (for production)
DB_SSL=true                        # Enable SSL connection
DB_SSL_REJECT_UNAUTHORIZED=true    # Reject unauthorized SSL certificates
DB_SSL_CA=/path/to/ca.pem          # Path to CA certificate
DB_SSL_CERT=/path/to/cert.pem      # Path to client certificate
DB_SSL_KEY=/path/to/key.pem        # Path to client key
```

## Implementation Details

### 1. Database Configuration (`src/config/database.config.ts`)

The database configuration module defines all pooling-related settings:

```typescript
export interface DatabaseConfig {
  // ... other settings
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
```

### 2. TypeORM DataSource (`src/config/data-source.ts`)

The DataSource configuration includes pooling settings in the `extra` object:

```typescript
extra: {
  min: 2,                    // Minimum pool size
  max: 20,                   // Maximum pool size
  idleTimeoutMillis: 10000,  // Remove idle connections after 10s
  acquireTimeoutMillis: 60000, // Wait up to 60s for available connection
  createTimeoutMillis: 30000,  // Wait up to 30s to create connection
  validateConnection: true,    // Validate connections before use
  statement_timeout: 30000,    // Cancel queries running longer than 30s
  query_timeout: 30000,        // Overall query timeout
  application_name: 'authcakes-production', // For monitoring
}
```

### 3. Application Module (`src/app.module.ts`)

The TypeORM module is configured with pooling settings from the configuration service:

```typescript
TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    // ... other settings
    extra: {
      min: Math.floor(configService.get<number>('database.poolSize') / 4),
      max: configService.get<number>('database.poolMaxConnections'),
      // ... other pooling settings
    }
  })
})
```

## Best Practices

### 1. Pool Size Calculation

The optimal pool size depends on:
- Number of application instances
- Expected concurrent requests
- Database connection limits
- Available system resources

Formula: `Pool Size = (Number of Workers × Average Connections per Worker) + Buffer`

Example for production:
- 4 application instances
- 5 average connections per instance
- 5 connection buffer
- Total: 25 connections (set DB_POOL_MAX=25)

### 2. Connection Validation

Always enable connection validation in production:
- Prevents using stale connections
- Detects network issues early
- Ensures connection health

### 3. Timeout Configuration

Set appropriate timeouts to prevent:
- Long-running queries blocking connections
- Connection acquisition deadlocks
- Resource exhaustion

Recommended settings:
- Idle timeout: 10-30 seconds
- Acquire timeout: 30-60 seconds
- Statement timeout: Based on expected query duration

### 4. Monitoring

Monitor these metrics:
- Active connections
- Idle connections
- Connection wait time
- Failed connection attempts
- Query execution time

Use database monitoring tools or APM solutions to track these metrics.

## Troubleshooting

### Common Issues

1. **"Connection pool timeout" errors**
   - Increase DB_POOL_MAX
   - Reduce DB_POOL_ACQUIRE_TIMEOUT to fail fast
   - Check for connection leaks

2. **"Too many connections" database errors**
   - Reduce DB_POOL_MAX
   - Check total connections across all instances
   - Review database connection limits

3. **Slow query performance**
   - Enable query logging
   - Check for missing indexes
   - Review statement timeout settings

### Debug Settings

For troubleshooting, enable detailed logging:

```bash
DB_LOGGING=true
NODE_ENV=development
```

This will log all SQL queries and connection pool events.

## Performance Optimization

1. **Use read replicas** for read-heavy workloads
2. **Implement query caching** for frequently accessed data
3. **Use database indexes** (see migration: AddPerformanceIndexes)
4. **Monitor slow queries** and optimize them
5. **Scale horizontally** by adding more application instances

## Security Considerations

1. Always use SSL in production (DB_SSL=true)
2. Rotate database credentials regularly
3. Use least-privilege database users
4. Monitor failed connection attempts
5. Implement IP whitelisting at database level

## Related Documentation

- [Database Operations](./DATABASE-OPERATIONS.md)
- [Production Configuration](./src/config/production.config.ts)
- [Environment Variables](./EnvironmentFile.md)