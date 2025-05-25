# TODO: E2E Testing Patterns & Best Practices

**Goal:** Write robust, reproducible end-to-end (e2e) tests for your backend using Jest and Supertest.

---

## 1. Test Structure
- Place e2e tests in `test/e2e/`.
- Use one file per major feature/module (e.g., `auth.e2e-spec.ts`, `tenants.e2e-spec.ts`).
- Use `describe` blocks for grouping related tests.

---

## 2. Seeding & Fixtures
- Seed or create required data (users, tenants, etc.) in your test setup (`beforeAll`, `beforeEach`).
- Use unique emails/usernames per test to avoid conflicts.
- Clean up or reset state as needed in `afterAll`/`afterEach`.

---

## 3. Authentication & Session Handling
- Register/login users via API endpoints in your tests.
- Store and use cookies or tokens for authenticated requests.
- Test session expiration, token refresh, and logout flows.

---

## 4. Multi-Tenant Scenarios
- Create tenants and assign users to them in your test setup.
- Test access to tenant-protected routes with both members and non-members.
- Assert correct access control (e.g., 200 for members, 403 for outsiders).

---

## 5. Reproducibility
- Use fresh data for each test (unique emails, slugs, etc.).
- Avoid dependencies between tests—each test should be self-contained.
- Use fixtures or factories for complex data if needed.

---

## 6. Best Practices
- Use `expect` assertions for all important outcomes.
- Test both positive and negative cases (success and failure).
- Keep tests fast and isolated.
- Document any custom test utilities or helpers.

---

**Circle back to this file for patterns and best practices when writing or updating e2e tests!** 