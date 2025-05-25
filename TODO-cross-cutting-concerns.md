# TODO: Cross-Cutting Concerns (Logging, Monitoring, Security, CORS, Cookies)

**Goal:** Maintain and extend robust request logging, performance monitoring, security headers, and secure CORS/cookie handling in your NestJS backend.

---

## 1. Request Logging
- **Where:** `src/common/middleware/logging.middleware.ts`
- **How:** Logs all HTTP requests and responses (method, URL, status).
- **Applied:** Globally in `AppModule` using the `NestModule` interface.
- **To extend:** Add more details (e.g., user ID, response time) in the middleware.

---

## 2. Performance Monitoring
- **Where:** `src/common/interceptors/performance.interceptor.ts`
- **How:** Logs the duration of each request.
- **Applied:** Globally as an `APP_INTERCEPTOR` in `AppModule`.
- **To extend:** Add metrics reporting (e.g., to Prometheus, Datadog) in the interceptor.

---

## 3. Security Headers
- **Where:** `src/main.ts` (uses `helmet`)
- **How:** Sets best-practice HTTP security headers for all responses.
- **To extend:** Configure `helmet` options as needed for your app.

---

## 4. CORS & Cookie Handling
- **Where:** `src/main.ts`
- **How:**
  - CORS is enabled with secure settings (`origin`, `credentials`, etc.).
  - `cookie-parser` is used for cookie handling.
  - Example for secure cookie settings:
    ```ts
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 * 1000,
    });
    ```
- **To extend:** Update allowed origins, headers, or cookie options as needed.

---

## 5. Best Practices
- Keep middleware and interceptors in `src/common/` for clarity.
- Use global application in `AppModule` for consistency.
- Regularly review and update security/CORS settings as your frontend or deployment changes.
- Add metrics or external logging as your observability needs grow.

---

**Circle back to this file for code locations, extension tips, and best practices when updating cross-cutting concerns!** 