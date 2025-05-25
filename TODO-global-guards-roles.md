# TODO: Using Global Role-Based and Tenant-Based Guards in NestJS

**Goal:** Enforce global and tenant role-based access control throughout the application using global guards and decorators.

---

## How It Works

- **Global Guards:**
  - `JwtAuthGuard`: Ensures the user is authenticated.
  - `RolesGuard`: Checks for global roles (e.g., `admin`).
  - `TenantAuthGuard`: Checks for tenant membership and tenant-specific roles.
- These guards are now applied globally in `AppModule`.

---

## How to Use

### 1. **Protecting Routes by Global Role**
- Use the `@Roles()` decorator on controllers or route handlers:
  ```ts
  @Roles('admin')
  @Get('admin-data')
  getAdminData() { ... }
  ```
- Only users with the specified global role(s) can access this route.

### 2. **Protecting Routes by Tenant Role**
- Use the `@TenantRoles()` decorator (if available) for tenant-specific roles:
  ```ts
  @TenantRoles('owner', 'manager')
  @Get('tenant-admin')
  getTenantAdminData() { ... }
  ```
- Only users with the specified tenant role(s) for the current tenant can access this route.

### 3. **Combining Global and Tenant Roles**
- Use both decorators for routes that require both:
  ```ts
  @Roles('admin')
  @TenantRoles('owner')
  @Get('secure-data')
  getSecureData() { ... }
  ```
- User must be a global admin **and** a tenant owner.

### 4. **Making Routes Public (No Auth Required)**
- Use the `@Public()` decorator on any controller or route handler to bypass all guards:
  ```ts
  @Public()
  @Get('public-info')
  getPublicInfo() { ... }
  ```
- Anyone can access this route, even if not authenticated.

---

## Notes
- You do **not** need to use `@UseGuards()` on most routes—just use the decorators.
- For custom logic, you can still use `@UseGuards()` to override or add guards on specific routes.
- If you add new roles or tenant roles, update your decorators accordingly.

---

**Circle back to this file for examples and usage patterns when adding or updating protected routes!** 