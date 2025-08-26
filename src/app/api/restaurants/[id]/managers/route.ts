import { db } from '@/lib/db';
import { requireRestaurantAccess } from '@/utils/auth-utils';
import { createServiceContext } from '@/utils/service-utils';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('ManagerService');

interface RouteParams {
    params: Promise<{
        restaurantId: string;
    }>;
}

// GET /api/restaurants/[restaurantId]/managers - Get managers for a restaurant
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { restaurantId } = await params;
        const { error, user } = await requireRestaurantAccess(restaurantId);

        if (error) return error;

        log.info('Fetching managers', { restaurantId, userId: user?.id });

        const managers = await db.user.findMany({
            where: {
                restaurantId,
                role: 'MANAGER',
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
            },
        });

        return NextResponse.json(managers);
    } catch (error) {
        log.error('Error fetching managers', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/restaurants/[restaurantId]/managers - Assign a manager to restaurant
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { restaurantId } = await params;
        const { error, user } = await requireRestaurantAccess(restaurantId);

        if (error) return error;

        // Only ADMINs can assign managers
        if (user?.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Forbidden: Only administrators can assign managers' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        log.info('Assigning manager', {
            restaurantId,
            userId,
            assignedBy: user.id,
        });

        // Update user to be a manager for this restaurant
        const updatedUser = await db.user.update({
            where: { id: userId },
            data: {
                role: 'MANAGER',
                restaurantId,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        log.error('Error assigning manager', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/restaurants/[restaurantId]/managers/[userId] - Remove manager
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ restaurantId: string; userId: string }> }
) {
    try {
        const { restaurantId, userId } = await params;
        const { error, user } = await requireRestaurantAccess(restaurantId);

        if (error) return error;

        // Only ADMINs can remove managers
        if (user?.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Forbidden: Only administrators can remove managers' },
                { status: 403 }
            );
        }

        // Verify user is a manager of this restaurant
        const manager = await db.user.findFirst({
            where: {
                id: userId,
                restaurantId,
                role: 'MANAGER',
            },
        });

        if (!manager) {
            return NextResponse.json(
                { error: 'Manager not found for this restaurant' },
                { status: 404 }
            );
        }

        log.info('Removing manager', {
            restaurantId,
            userId,
            removedBy: user.id,
        });

        // Remove manager role and restaurant association
        const updatedUser = await db.user.update({
            where: { id: userId },
            data: {
                role: 'USER',
                restaurantId: null,
            },
        });

        return NextResponse.json({
            message: 'Manager removed successfully',
            user: updatedUser,
        });
    } catch (error) {
        log.error('Error removing manager', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
