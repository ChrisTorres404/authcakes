# APM (Application Performance Monitoring) Setup Guide

This guide covers the setup and configuration of DataDog APM for the AuthCakes API.

## Prerequisites

1. DataDog account with APM enabled
2. DataDog Agent installed on your infrastructure
3. API keys configured

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# DataDog Configuration
DD_SERVICE=authcakes-api
DD_ENV=production
DD_VERSION=1.0.0
DD_AGENT_HOST=localhost
DD_TRACE_AGENT_PORT=8126
DD_DOGSTATSD_PORT=8125
DD_LOGS_INJECTION=true
DD_RUNTIME_METRICS_ENABLED=true
DD_PROFILING_ENABLED=true

# Enable APM in non-production environments (optional)
ENABLE_APM=true

# DataDog API Keys (for dashboard creation)
DD_API_KEY=your_datadog_api_key
DD_APP_KEY=your_datadog_app_key
```

## Installation

1. Install the DataDog Agent on your server:

```bash
# Ubuntu/Debian
DD_API_KEY=your_api_key DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script_agent7.sh)"

# Docker
docker run -d --name datadog-agent \
  -e DD_API_KEY=your_api_key \
  -e DD_SITE="datadoghq.com" \
  -e DD_APM_ENABLED=true \
  -e DD_LOGS_ENABLED=true \
  -e DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=true \
  -e DD_CONTAINER_EXCLUDE="name:datadog-agent" \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /proc/:/host/proc/:ro \
  -v /sys/fs/cgroup/:/host/sys/fs/cgroup:ro \
  -p 8126:8126/tcp \
  -p 8125:8125/udp \
  datadog/agent:latest
```

2. Install required npm packages (already included in package.json):

```bash
npm install dd-trace node-statsd
```

## Features

### 1. Automatic Request Tracing

All HTTP requests are automatically traced with:
- Request method and URL
- Response status codes
- Request duration
- Error tracking
- User agent and IP information

### 2. Custom Business Metrics

The following business metrics are tracked:

#### Authentication Metrics
- `authcakes.auth.login.success` - Successful login attempts
- `authcakes.auth.login.failure` - Failed login attempts
- `authcakes.auth.registration.success` - Successful registrations
- `authcakes.auth.registration.failure` - Failed registrations
- `authcakes.auth.password_change.success` - Successful password changes
- `authcakes.auth.account_recovery.*` - Account recovery stages
- `authcakes.auth.mfa.*` - MFA events (enabled, disabled, verified, failed)

#### Session Metrics
- `authcakes.session.created` - New sessions created
- `authcakes.session.revoked` - Sessions revoked (with reason)
- `authcakes.session.active` - Active session gauge
- `authcakes.token.refresh.success` - Successful token refreshes

#### Tenant Metrics
- `authcakes.tenant.created` - New tenants created
- `authcakes.tenant.member.added` - Members added to tenants
- `authcakes.tenant.invitation.*` - Invitation lifecycle events

#### Security Metrics
- `authcakes.security.event.*` - Security events by severity
- `authcakes.security.brute_force.attempt` - Brute force detection
- `authcakes.security.rate_limit.hit` - Rate limiting triggers

#### Performance Metrics
- `authcakes.api.latency` - API endpoint latency histogram
- `authcakes.api.slow_request` - Requests over 1s
- `authcakes.database.query.duration` - Database query performance
- `authcakes.cache.hit/miss` - Cache performance

### 3. Health Monitoring

Health check endpoints with monitoring:
- `/api/health` - Basic health check
- `/api/health/live` - Kubernetes liveness probe
- `/api/health/ready` - Readiness probe with dependency checks
- `/api/health/metrics` - Application metrics summary

### 4. Distributed Tracing

The APM integration supports distributed tracing across:
- HTTP requests
- Database queries
- External API calls
- Background jobs

### 5. Error Tracking

Automatic error tracking with:
- Stack traces
- Error types and messages
- Request context
- User information (when available)

## Dashboard Setup

1. Import the dashboard configuration:

```bash
# Using DataDog API
curl -X POST "https://api.datadoghq.com/api/v1/dashboard" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
  -H "Content-Type: application/json" \
  -d @src/config/datadog-dashboards.json
```

2. Or manually create dashboards in DataDog UI using the provided configuration.

## Alerts Configuration

The following alerts are pre-configured:

1. **High Error Rate** - Triggers when error rate exceeds 5%
2. **High Response Time** - Triggers when p95 latency exceeds 1s
3. **Brute Force Detection** - Triggers on potential brute force attacks
4. **Database Performance** - Triggers on slow database queries
5. **Authentication Failures** - Triggers on authentication failure spikes
6. **Memory Leak Detection** - Triggers on high memory usage
7. **Rate Limiting** - Triggers when rate limits are frequently hit

## Custom Instrumentation

To add custom metrics in your code:

```typescript
import { MetricsService } from './modules/monitoring/services/metrics.service';

// Inject the service
constructor(private metrics: MetricsService) {}

// Track custom metrics
this.metrics.increment('custom.event', { tag: 'value' });
this.metrics.gauge('custom.gauge', 42);
this.metrics.histogram('custom.histogram', 100);

// Measure operation duration
const result = await this.metrics.measureDuration(
  'expensive_operation',
  async () => {
    // Your code here
    return result;
  },
  { operation: 'type' }
);
```

## Performance Impact

The APM integration has minimal performance impact:
- ~2-3% CPU overhead
- ~10-20MB memory overhead
- Sampling rate adjustable (10% in production by default)

## Troubleshooting

### APM not working

1. Check DataDog Agent is running:
```bash
sudo datadog-agent status
```

2. Verify connectivity:
```bash
curl -v http://localhost:8126/v0.3/traces
```

3. Check logs:
```bash
sudo tail -f /var/log/datadog/agent.log
```

### Missing metrics

1. Ensure StatsD is enabled in DataDog Agent
2. Check firewall rules for ports 8125 (UDP) and 8126 (TCP)
3. Verify environment variables are set correctly

### High memory usage

1. Adjust sampling rate in production
2. Reduce trace retention period
3. Disable profiling if not needed

## Security Considerations

1. Never expose DataDog API keys in client-side code
2. Use read-only keys where possible
3. Sanitize sensitive data before sending to APM
4. Configure data retention policies

## Production Checklist

- [ ] DataDog Agent installed and running
- [ ] Environment variables configured
- [ ] Dashboards imported
- [ ] Alerts configured
- [ ] Sampling rate adjusted for production
- [ ] Data retention policies set
- [ ] Team notifications configured
- [ ] Runbook documentation created