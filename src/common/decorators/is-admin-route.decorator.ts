import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark a route as an admin-only route
 * Used by guards to apply different logic for admin routes
 */
export const IsAdminRoute = () => SetMetadata('isAdminRoute', true);
