# TODO: Using and Extending the AuthModule

**Goal:** Understand how to use, extend, and maintain the AuthModule for authentication, authorization, and session management in your NestJS app.

---

## How It Works
- The `AuthModule` provides all authentication and session management features.
- It is self-contained and exports all services, guards, and strategies needed by other modules.
- Uses Passport strategies, JWT, and TypeORM repositories.

---

## How to Use

### 1. **Inject Auth Services in Other Modules**
- Import `AuthModule` in any feature module that needs authentication:
  ```ts
  import { AuthModule } from '../auth/auth.module';
  @Module({ imports: [AuthModule, ...] })
  export class SomeFeatureModule {}
  ```
- Inject services in your providers/controllers:
  ```ts
  constructor(private readonly authService: AuthService) {}
  ```

### 2. **Use Guards in Controllers**
- Use guards like `JwtAuthGuard`, `JwtRefreshGuard`, or `LocalAuthGuard` to protect routes:
  ```ts
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile() { ... }
  ```
- If guards are global (see AppModule), you only need to use decorators like `@Roles()` or `@Public()`.

### 3. **Add New Passport Strategies**
- Create a new strategy in `src/modules/auth/strategies/`.
- Register it in the `providers` array of `AuthModule`.
- Export it if needed by other modules.

### 4. **Add New Guards or Services**
- Create the guard/service in `src/modules/auth/guards/` or `services/`.
- Register it in the `providers` array.
- Export it if needed.

### 5. **Add New Entities or Repositories**
- Add the entity to `src/modules/auth/entities/`.
- Register it in `TypeOrmModule.forFeature([...])` in `imports`.

### 6. **JWT and Config**
- JWT secret and expiration are loaded from your config service.
- Update your `.env` or config files to change JWT settings.

---

## Best Practices
- Keep strategies, guards, and services in their own folders for clarity.
- Only export what other modules need.
- Use async config for JWT to support environment-based settings.
- Use `TypeOrmModule.forFeature` for all entities and custom repositories.
- Keep controllers thin—put logic in services.

---

**Circle back to this file for onboarding, extension, or maintenance of the AuthModule!** 