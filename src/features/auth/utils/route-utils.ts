import { paths, routes } from '@/config/routes';
import type { RouteData, RoutePath } from '@/types/routes';

/**
 * Returns true if the given path is a public route.
 * Public routes are accessible without authentication (sign-in, sign-up, landing, etc.).
 * @param {RoutePath | string} path Path to check
 * @returns {boolean} True if public route, false otherwise
 */
export function isPublicRoute(path: RoutePath): boolean;
export function isPublicRoute(path: string): boolean;
export function isPublicRoute(path: string): boolean {
    const routeEntry = getRouteData(path);
    return routeEntry?.accessType === 'public';
}

/**
 * Returns true if the given path is a protected route.
 * Protected routes require authentication to access.
 * @param {RoutePath | string} path Path to check
 * @returns {boolean} True if protected route, false otherwise
 */
export function isProtectedRoute(path: RoutePath): boolean;
export function isProtectedRoute(path: string): boolean;
export function isProtectedRoute(path: string): boolean {
    const routeEntry = getRouteData(path);
    return routeEntry?.accessType === 'protected';
}

/**
 * Returns true if the given path is a universal route.
 * Universal routes can be accessed by both authenticated and unauthenticated users.
 * @param {RoutePath | string} path Path to check
 * @returns {boolean} True if universal route, false otherwise
 */
export function isUniversalRoute(path: RoutePath): boolean;
export function isUniversalRoute(path: string): boolean;
export function isUniversalRoute(path: string): boolean {
    const routeEntry = getRouteData(path);
    return routeEntry?.accessType === 'universal';
}

/**
 * Retrieves the route data for a given path.
 * Returns undefined if the path does not match any route.
 * @param {RoutePath | string} path Path to look up
 * @returns {RouteData | undefined} Route metadata or undefined
 */
export function getRouteData(path: RoutePath): RouteData | undefined;
export function getRouteData(path: string): RouteData | undefined;
export function getRouteData(path: string): RouteData | undefined {
    // Extract just the path part, removing query parameters and fragments
    const pathWithoutQuery = path.split('?')[0]?.split('#')[0] ?? path;
    const normalizedPath = normalizePath(pathWithoutQuery);

    // First try to find an exact match
    const exactMatch = Object.values(routes).find(
        (route) => route.path === normalizedPath
    );
    if (exactMatch) return exactMatch;

    // If no exact match, sort routes by path length (longest first)
    // and find the first matching route segment (handles nested routes)
    return Object.values(routes)
        .sort((a, b) => b.path.length - a.path.length)
        .find((route): boolean => {
            // Handle root path specially
            if (route.path === '/') {
                return normalizedPath === '/';
            }

            // Check if the normalized path starts with the route path
            // and ensure it's a proper path segment boundary
            return (
                normalizedPath.startsWith(route.path) &&
                (normalizedPath.length === route.path.length ||
                    normalizedPath[route.path.length] === '/')
            );
        });
}

/**
 * Returns the path to redirect to after a successful login.
 * This can be customized based on application requirements.
 * @param {string} [returnTo] - Optional return URL from query params
 * @returns {string} Path to redirect to after login
 */
export function getAfterLoginPath(returnTo?: string): string {
    // If returnTo is provided and it's a safe internal path, use it
    if (returnTo && isSafeRedirectPath(returnTo)) {
        return returnTo;
    }
    return paths.dashboard;
}

/**
 * Checks if a redirect path is safe (internal to the application).
 * Prevents open redirect vulnerabilities.
 * @param {string} path - The path to validate
 * @returns {boolean} True if the path is safe for redirect
 */
export function isSafeRedirectPath(path: string): boolean {
    try {
        // Must start with / and not be a protocol
        if (!path.startsWith('/') || path.startsWith('//')) {
            return false;
        }

        // Normalize the path
        const normalized = normalizePath(path);

        // Additional safety checks
        if (normalized.includes('..') || normalized.includes('\0')) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
}

/**
 * Normalizes a URL path by:
 * - Removing duplicate slashes
 * - Resolving dot segments (./ and ../)
 * - Ensuring consistent leading slash
 *
 * @param {string} path The path to normalize
 * @returns {string} Normalized path
 */
export function normalizePath(path: string): string {
    // Handle empty path
    if (!path) return '/';

    // Step 1: Remove duplicate slashes
    let normalized = path.replace(/\/+/g, '/');

    // Step 2: Handle dot segments
    const segments = normalized.split('/');
    const result: string[] = [];

    for (const segment of segments) {
        if (segment === '..') {
            // Go up one level by removing the last segment
            // But don't go above the root
            if (result.length > 0) {
                result.pop();
            }
        } else if (segment !== '.' && segment !== '') {
            // Skip empty segments and current directory (.) segments
            result.push(segment);
        }
    }

    // Step 3: Ensure consistent format
    normalized = '/' + result.join('/');

    // Remove trailing slash except for the root path
    if (normalized !== '/' && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }

    return normalized;
}

/**
 * Utility to check what type of route a path is
 * Useful for debugging and testing
 */
export function getRouteType(
    path: string
): 'public' | 'protected' | 'universal' | 'unknown' {
    const routeData = getRouteData(path);
    return routeData?.accessType ?? 'unknown';
}

/**
 * Debug helper to log route information
 */
export function debugRoute(path: string): void {
    const routeData = getRouteData(path);
    console.log(`[RouteDebug] Path: ${path}`);
    console.log(`[RouteDebug] Normalized: ${normalizePath(path)}`);
    console.log(`[RouteDebug] Route Data:`, routeData);
    console.log(`[RouteDebug] Type: ${getRouteType(path)}`);
}
