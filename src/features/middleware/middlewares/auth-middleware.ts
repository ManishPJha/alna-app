import { appConfig } from '@/config/appConfig';
import { authConfig } from '@/config/auth';
import { paths } from '@/config/routes';
import {
    isProtectedRoute,
    isPublicRoute,
    isUniversalRoute,
} from '@/features/auth';
import { NextResponse } from 'next/server';
import type { Middleware } from '../types';

/**
 * Authentication middleware that enforces route access rules.
 *
 * Route Types:
 * - Universal: Accessible by everyone (authenticated + unauthenticated)
 * - Protected: Requires authentication
 * - Public: Only for unauthenticated users (sign-in, sign-up, etc.)
 */
export const authMiddleware: Middleware = async (request, next) => {
    const path = request.nextUrl.pathname;

    console.log(
        '________________environment_________________',
        appConfig.environment,
        authConfig.sessionCookieName
    );

    // Universal routes can be accessed by everyone - no auth checks needed
    if (isUniversalRoute(path)) {
        return await next();
    }

    // Check authentication status
    const sessionCookie = request.cookies.get(authConfig.sessionCookieName);
    const hasSession = !!sessionCookie?.value;

    // Log for debugging (remove in production)
    console.log(`[AuthMiddleware] Path: ${path}, HasSession: ${hasSession}`);

    // Handle protected routes - require authentication
    if (isProtectedRoute(path)) {
        if (!hasSession) {
            console.log(
                `[AuthMiddleware] Redirecting unauthenticated user from ${path} to landing page`
            );
            return NextResponse.redirect(
                new URL(paths.landingPage, request.url)
            );
        }
        // User is authenticated and accessing protected route - allow access
        return await next();
    }

    // Handle public routes - only for unauthenticated users
    if (isPublicRoute(path)) {
        if (hasSession) {
            console.log(
                `[AuthMiddleware] Redirecting authenticated user from ${path} to dashboard`
            );
            return NextResponse.redirect(new URL(paths.dashboard, request.url));
        }
        // User is unauthenticated and accessing public route - allow access
        return await next();
    }

    // For routes that don't match any category, determine behavior based on auth status
    // This handles edge cases and undefined routes
    if (hasSession) {
        // Authenticated users can access undefined routes (might be dynamic routes)
        return await next();
    } else {
        // Unauthenticated users get redirected to landing page for safety
        console.log(
            `[AuthMiddleware] Redirecting unauthenticated user from undefined route ${path} to landing page`
        );
        return NextResponse.redirect(new URL(paths.landingPage, request.url));
    }
};
