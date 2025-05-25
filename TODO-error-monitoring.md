# TODO: Error Handling & Monitoring

**Goal:** Handle errors globally and monitor your app with external tools.

---

## 1. Global Error Handling
- Use `AllExceptionsFilter` in `src/common/filters/all-exceptions.filter.ts`.
- Extend it to handle custom error types or log to external services.
- Register as a global filter in `AppModule`.

---

## 2. Monitoring & External Integration
- Integrate with Sentry, Datadog, or similar in `main.ts` or as a global interceptor.
- Use their SDKs to capture errors and performance metrics.
- Example (Sentry):
  ```ts
  import * as Sentry from '@sentry/node';
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  // Capture errors in filters/interceptors
  ```

---

## 3. Best Practices
- Always log errors with enough context (user, request, stack trace).
- Alert on critical errors in production.
- Regularly review error logs and monitoring dashboards.

---

**Circle back to this file for steps and best practices when updating error handling or monitoring!** 