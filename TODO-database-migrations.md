# TODO: Database & Migrations (TypeORM)

**Goal:** Manage database schema, migrations, and seeds for the backend using TypeORM.

---

## 1. Creating a New Migration
- Use TypeORM CLI or npm script:
  ```sh
  npm run typeorm:migration:generate -- -n MigrationName
  ```
- Edit the generated file in `src/migrations/` as needed.

---

## 2. Running/Reverting Migrations
- To apply all pending migrations:
  ```sh
  npm run typeorm:migration:run
  ```
- To revert the last migration:
  ```sh
  npm run typeorm:migration:revert
  ```

---

## 3. Adding New Entities
- Add entity class in `src/modules/[module]/entities/`.
- Register it in the relevant module and in `TypeOrmModule.forFeature([...])`.
- Generate a migration to update the schema.

---

## 4. Seeding the Database
- Add seed scripts in `src/database/seeds/`.
- Run seeds using a custom script or CLI command.
- Example:
  ```sh
  npm run seed:dev
  ```

---

**Circle back to this file for steps and best practices when updating the database schema or running migrations!** 