import { authConfig } from '@/config/auth';
import { paths } from '@/config/routes';
import {
    isProtectedRoute,
    isPublicRoute,
    isUniversalRoute,
} from '@/features/auth';
import { validateSession } from '@/utils/validate-session';
import { NextResponse } from 'next/server';
import type { Middleware } from '../types';

/**
 * Authentication middleware that enforces route access rules with session validation
 */
export const authMiddleware: Middleware = async (request, next) => {
    const path = request.nextUrl.pathname;

    // Universal routes can be accessed by everyone - no auth checks needed
    if (isUniversalRoute(path)) {
        return await next();
    }

    // Check authentication status
    const sessionCookie = request.cookies.get(authConfig.sessionCookieName);
    const hasSession = !!sessionCookie?.value;
    let isValidSession = false;

    // Validate session against database for protected routes
    if (hasSession) {
        try {
            isValidSession = await validateSession(sessionCookie.value);
            console.log('Session validation result:', isValidSession);

            // Clear invalid session cookie
            if (!isValidSession) {
                const response = NextResponse.next();
                response.cookies.delete(authConfig.sessionCookieName);
                return response;
            }
        } catch (error) {
            console.error('Session validation failed:', error);
            // If validation fails, treat as invalid session
            const response = NextResponse.next();
            response.cookies.delete(authConfig.sessionCookieName);
            return response;
        }
    }

    // Handle protected routes - require valid authentication
    if (isProtectedRoute(path)) {
        if (!isValidSession) {
            console.log(
                `[AuthMiddleware] Redirecting invalid session from ${path} to landing page`
            );
            return NextResponse.redirect(
                new URL(paths.landingPage, request.url)
            );
        }
        // User has valid session and accessing protected route - allow access
        return await next();
    }

    // Handle public routes - only for unauthenticated users
    if (isPublicRoute(path)) {
        if (isValidSession) {
            console.log(
                `[AuthMiddleware] Redirecting authenticated user from ${path} to dashboard`
            );
            return NextResponse.redirect(new URL(paths.dashboard, request.url));
        }
        // User is unauthenticated and accessing public route - allow access
        return await next();
    }

    // For routes that don't match any category, determine behavior based on auth status
    if (isValidSession) {
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
