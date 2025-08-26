import { UserRole } from '@/types/routes';

/**
 * Check if a user role has permission for a specific action
 */
export const permissions = {
    // Restaurant permissions
    canCreateRestaurant: (role: UserRole) => role === 'ADMIN',
    canEditRestaurant: (role: UserRole, isOwn: boolean = false) =>
        role === 'ADMIN' || (role === 'MANAGER' && isOwn),
    canDeleteRestaurant: (role: UserRole) => role === 'ADMIN',
    canViewAllRestaurants: (role: UserRole) => role === 'ADMIN',

    // User permissions
    canManageUsers: (role: UserRole) => role === 'ADMIN',
    canCreateManager: (role: UserRole) => role === 'ADMIN',
    canEditUser: (role: UserRole, isOwn: boolean = false) =>
        role === 'ADMIN' || isOwn,

    // Menu permissions
    canEditMenu: (role: UserRole, isOwnRestaurant: boolean = false) =>
        role === 'ADMIN' || (role === 'MANAGER' && isOwnRestaurant),
    canPublishMenu: (role: UserRole, isOwnRestaurant: boolean = false) =>
        role === 'ADMIN' || (role === 'MANAGER' && isOwnRestaurant),

    // Order permissions
    canViewOrders: (role: UserRole, isOwnRestaurant: boolean = false) =>
        role === 'ADMIN' || (role === 'MANAGER' && isOwnRestaurant),
    canUpdateOrderStatus: (role: UserRole, isOwnRestaurant: boolean = false) =>
        role === 'ADMIN' || (role === 'MANAGER' && isOwnRestaurant),

    // Analytics permissions
    canViewGlobalAnalytics: (role: UserRole) => role === 'ADMIN',
    canViewRestaurantAnalytics: (
        role: UserRole,
        isOwnRestaurant: boolean = false
    ) => role === 'ADMIN' || (role === 'MANAGER' && isOwnRestaurant),
};

/**
 * Get the highest role from a list of roles
 */
export function getHighestRole(roles: UserRole[]): UserRole {
    if (roles.includes('ADMIN')) return 'ADMIN';
    if (roles.includes('MANAGER')) return 'MANAGER';
    return 'USER';
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(
    userRole: UserRole,
    allowedRoles: UserRole[]
): boolean {
    return allowedRoles.includes(userRole);
}

/**
 * Get accessible routes for a user role
 */
export function getAccessibleRoutes(role: UserRole): string[] {
    const routes: string[] = ['/dashboard', '/profile', '/settings'];

    if (role === 'ADMIN') {
        routes.push(
            '/admin',
            '/admin/users',
            '/admin/restaurants',
            '/admin/analytics',
            '/manager',
            '/manager/menu',
            '/manager/orders',
            '/manager/qr-codes',
            '/manager/analytics'
        );
    } else if (role === 'MANAGER') {
        routes.push(
            '/manager',
            '/manager/menu',
            '/manager/orders',
            '/manager/qr-codes',
            '/manager/analytics'
        );
    }

    return routes;
}
