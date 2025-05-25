# TODO: Testing (Backend & Frontend)

**Goal:** Write and run unit, integration, and e2e tests for both backend and frontend.

---

## 1. Backend Testing (NestJS)
- **Unit tests:** In `test/unit/` using Jest.
- **Integration tests:** In `test/e2e/` using Jest and Supertest.
- **Run all tests:**
  ```sh
  npm run test
  npm run test:watch
  npm run test:e2e
  ```
- **Mocking:** Use Jest mocks or `@nestjs/testing` utilities.

---

## 2. Frontend Testing (React)
- **Unit/component tests:** In `frontend/src/__tests__/` or alongside components.
- **Tools:** Jest, React Testing Library.
- **Run tests:**
  ```sh
  npm run test
  ```
- **Mocking:** Use Jest mocks and MSW (Mock Service Worker) for API calls.

---

## 3. Best Practices
- Keep tests close to the code they test.
- Use factories or fixtures for test data.
- Mock external dependencies and services.

---

**Circle back to this file for steps and best practices when writing or running tests!** 