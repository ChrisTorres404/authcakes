# TODO: TenantsController Usage & Extension Guide

**Goal:** Maintain, extend, and document the TenantsController for tenant CRUD, membership, and settings management with proper authorization and API docs.

---

## 1. How to Add New Tenant Routes
- Add a new method to `TenantsController` (e.g., for a new feature or query):
  ```ts
  @Get('custom')
  customRoute() {
    // ...logic
  }
  ```
- Implement the corresponding logic in `TenantsService`.
- Inject any needed services via the controller constructor.

---

## 2. How to Protect Routes with Guards and Decorators
- **Global Auth:** All routes are protected by `JwtAuthGuard` (set at controller level).
- **Tenant Membership/Role:**
  - Use `@UseGuards(TenantAuthGuard)` for tenant membership checks.
  - Use `@TenantRoles('admin')` (or other roles) to restrict to tenant admins or specific roles.
  - Example:
    ```ts
    @UseGuards(TenantAuthGuard)
    @TenantRoles('admin')
    @Post(':id/members')
    addUserToTenant(...) { ... }
    ```
- **Public/Unprotected:** Use `@Public()` (if implemented) to bypass all guards for a route.

---

## 3. How to Document Routes for OpenAPI/Swagger
- Use decorators from `@nestjs/swagger`:
  - `@ApiOperation({ summary: '...' })` — Short description
  - `@ApiResponse({ status: 200, description: '...' })` — Success response
  - `@ApiBadRequestResponse`, `@ApiNotFoundResponse` — Error responses
  - `@ApiParam({ name: 'id', type: 'string' })` — Path params
  - `@ApiBody({ type: DtoClass })` — Request body
- Example:
  ```ts
  @ApiOperation({ summary: 'Invite a user to a tenant' })
  @ApiParam({ name: 'tenantId', type: 'string', format: 'uuid' })
  @ApiBody({ type: InviteTenantMemberDto })
  @ApiResponse({ status: 201, description: 'Invitation sent' })
  @Post(':tenantId/invite')
  inviteMember(...) { ... }
  ```
- Keep DTOs in the `dto/` folder and reference them in decorators for type safety and docs.

---

**Circle back to this file for best practices and examples when updating or extending tenant-related routes!** 