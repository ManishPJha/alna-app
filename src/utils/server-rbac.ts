import { getSession } from '@/features/auth';
import { db } from '@/lib/db';
import { UserRole } from '@/types/routes';
import { redirect } from 'next/navigation';

interface RBACCheckResult {
    allowed: boolean;
    user?: {
        id: string;
        role: UserRole;
        restaurantId?: string | null;
        restaurant?: {
            id: string;
            name: string;
        } | null;
    };
    reason?: string;
}

/**
 * Server-side RBAC check for page components
 */
export async function checkPageAccess(
    requiredRoles: UserRole[],
    requireRestaurant: boolean = false
): Promise<RBACCheckResult> {
    const session = await getSession();

    if (!session?.user?.id) {
        return { allowed: false, reason: 'Not authenticated' };
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            role: true,
            isActive: true,
            restaurantId: true,
            restaurant: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    if (!user || !user.isActive) {
        return { allowed: false, reason: 'User not found or inactive' };
    }

    if (!requiredRoles.includes(user.role as UserRole)) {
        return { allowed: false, reason: 'Insufficient permissions' };
    }

    if (requireRestaurant && !user.restaurantId) {
        return { allowed: false, reason: 'No restaurant assigned' };
    }

    return {
        allowed: true,
        user: {
            id: user.id,
            role: user.role as UserRole,
            restaurantId: user.restaurantId,
            restaurant: user.restaurant,
        },
    };
}

/**
 * Enforce page access with automatic redirect
 */
export async function enforcePageAccess(
    requiredRoles: UserRole[],
    requireRestaurant: boolean = false
) {
    const access = await checkPageAccess(requiredRoles, requireRestaurant);

    if (!access.allowed) {
        if (access.reason === 'Not authenticated') {
            redirect('/auth/signin');
        } else if (access.reason === 'No restaurant assigned') {
            redirect('/no-restaurant');
        } else {
            redirect('/unauthorized');
        }
    }

    return access.user!;
}
