# TODO: Configuration & Environment Management

**Goal:** Manage environment variables and config files for all environments (dev, prod, test).

---

## 1. Adding/Updating Environment Variables
- Edit `.env` or `.env.example` in the project root.
- Add new variables with clear names and example values.

---

## 2. Using Config Files
- Config files are in `src/config/` (e.g., `auth.config.ts`, `database.config.ts`).
- Use `@nestjs/config` and `registerAs()` for modular config.
- Access config in code via `ConfigService`.

---

## 3. Validation Schemas
- Use `validation.schema.ts` (Joi) to validate all env variables at startup.
- Add new variables to the schema when updating config.

---

**Circle back to this file for steps and best practices when updating environment variables or config!** 