import { auth } from '@/features/auth/handlers';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

interface AuthorizedUser {
    id: string;
    email: string | null;
    role: 'USER' | 'MANAGER' | 'ADMIN';
    restaurantId: string | null;
}

/**
 * Check if user is authenticated and return user with their role and restaurant
 */
export async function requireAuth() {
    const session = await auth();

    if (!session?.user) {
        return {
            error: NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            ),
            user: null,
        };
    }

    // Fetch full user details including restaurant relationship
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            email: true,
            role: true,
            restaurantId: true,
        },
    });

    if (!user) {
        return {
            error: NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            ),
            user: null,
        };
    }

    return { error: null, user };
}

export async function requireAdminAccess() {
    const { error, user } = await requireAuth();

    if (error || !user) {
        return {
            error:
                error ||
                NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
            user: null,
        };
    }

    if (user.role !== 'ADMIN') {
        return {
            error: NextResponse.json(
                { error: 'Forbidden: You do not have access to this action' },
                { status: 403 }
            ),
            user,
        };
    }

    return { error: null, user };
}

/**
 * Check if user can access a specific restaurant's data
 * Admins can access all restaurants, managers only their assigned restaurant
 */
export async function canAccessRestaurant(
    user: AuthorizedUser,
    restaurantId: string
): Promise<boolean> {
    // Admins can access all restaurants
    if (user.role === 'ADMIN') {
        return true;
    }

    // Managers can only access their assigned restaurant
    if (user.role === 'MANAGER') {
        return user.restaurantId === restaurantId;
    }

    // Regular users cannot access restaurant management
    return false;
}

/**
 * Verify restaurant exists and user has access to it
 */
export async function requireRestaurantAccess(restaurantId: string) {
    const { error, user } = await requireAuth();

    if (error || !user) {
        return {
            error:
                error ||
                NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
            user: null,
            restaurant: null,
        };
    }

    // Check if restaurant exists
    const restaurant = await db.restaurant.findUnique({
        where: { id: restaurantId },
    });

    if (!restaurant) {
        return {
            error: NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404 }
            ),
            user,
            restaurant: null,
        };
    }

    // Check if user has access to this restaurant
    const hasAccess = await canAccessRestaurant(user, restaurantId);

    if (!hasAccess) {
        return {
            error: NextResponse.json(
                {
                    error: 'Forbidden: You do not have access to this restaurant',
                },
                { status: 403 }
            ),
            user,
            restaurant: null,
        };
    }

    return { error: null, user, restaurant };
}

/**
 * Get restaurants that the user can access
 */
export async function getUserRestaurants(user: AuthorizedUser) {
    if (user.role === 'ADMIN') {
        // Admins can see all restaurants
        return db.restaurant.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    if (user.role === 'MANAGER' && user.restaurantId) {
        // Managers can only see their assigned restaurant
        return db.restaurant.findMany({
            where: { id: user.restaurantId },
        });
    }

    // Regular users see no restaurants
    return [];
}
