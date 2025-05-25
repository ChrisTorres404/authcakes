# TODO: Deployment & CI/CD

**Goal:** Build, deploy, and automate the deployment of your app locally and in production.

---

## 1. Local Development
- Start backend and frontend with npm scripts:
  ```sh
  npm run start:dev
  cd frontend && npm run dev
  ```

---

## 2. Docker Deployment
- Use `docker-compose.yml` for local or cloud deployment.
- Build and run:
  ```sh
  docker-compose up --build
  ```
- Update Dockerfiles and compose files as needed for new services.

---

## 3. CI/CD Pipelines
- Use GitHub Actions, GitLab CI, or similar for automated tests and deployment.
- Example: `.github/workflows/` for GitHub Actions.
- Add steps for build, test, and deploy.

---

**Circle back to this file for steps and best practices when deploying or updating CI/CD!** 