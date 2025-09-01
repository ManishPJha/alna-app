import { db } from '@/lib/db';
import { canAccessRestaurant, requireAuth } from '@/utils/auth-utils';
import { createServiceContext } from '@/utils/service-utils';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('RestaurantService');

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// GET /api/restaurants/[id] - Get a single restaurant by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const { error, user } = await requireAuth();

        if (error || !user) return error;

        // Check if user has access to this restaurant
        const hasAccess = await canAccessRestaurant(user, id);

        if (!hasAccess) {
            return NextResponse.json(
                {
                    error: 'Forbidden: You do not have access to this restaurant',
                },
                { status: 403 }
            );
        }

        log.info('restaurant GET by ID', { id, userId: user.id });

        const restaurant = await db.restaurant.findUnique({
            where: { id },
            include: {
                // Include related counts for UI display
                _count: {
                    select: {
                        managers: true,
                        qrCodes: true,
                        menuItems: true,
                        menus: true, // ADDED: Count of menus
                        orders: true,
                    },
                },
                // Optionally include managers if needed
                managers: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        isActive: true,
                        lastLogin: true,
                    },
                },
                // Include menus for this restaurant
                menus: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        isActive: true,
                        isPublished: true,
                        version: true,
                        createdAt: true,
                        updatedAt: true,
                        _count: {
                            select: {
                                categories: true,
                                faqs: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5, // Limit for overview
                },
            },
        });

        if (!restaurant) {
            return NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404 }
            );
        }

        // Transform the response to include counts as flat properties
        const response = {
            ...restaurant,
            managersCount: restaurant._count.managers,
            qrCodesCount: restaurant._count.qrCodes,
            menuItemsCount: restaurant._count.menuItems,
            menusCount: restaurant._count.menus, // ADDED
            ordersCount: restaurant._count.orders,
            _count: undefined, // Remove the _count object from response
        };

        return NextResponse.json(response);
    } catch (error) {
        log.error('restaurant GET by ID error', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/restaurants/[id] - Update a restaurant
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { error, user } = await requireAuth();

        if (error || !user) return error;

        const { id } = await params;

        // Check if user has access to this restaurant
        const hasAccess = await canAccessRestaurant(user, id);

        if (!hasAccess) {
            return NextResponse.json(
                {
                    error: 'Forbidden: You do not have access to this restaurant',
                },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Check if restaurant exists
        const existingRestaurant = await db.restaurant.findUnique({
            where: { id },
        });

        if (!existingRestaurant) {
            return NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404 }
            );
        }

        // Extract updatable fields from body (REMOVED menu-related fields)
        const {
            name,
            description,
            address,
            phone,
            email,
            defaultLanguage,
            timezone,
            logoUrl,
            themeColor,
        } = body;

        // Validate fields if provided
        if (email && !isValidEmail(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        if (phone && !isValidPhone(phone)) {
            return NextResponse.json(
                { error: 'Invalid phone format' },
                { status: 400 }
            );
        }

        log.info('restaurant PUT', { id, body });

        // Update the restaurant
        const updatedRestaurant = await db.restaurant.update({
            where: { id },
            data: {
                name,
                description,
                address,
                phone,
                email,
                defaultLanguage,
                timezone,
                logoUrl,
                themeColor,
                // REMOVED: menuTheme, isMenuPublished, menuVersion, lastMenuUpdate
            },
        });

        return NextResponse.json(updatedRestaurant);
    } catch (error) {
        log.error('restaurant PUT error', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH /api/restaurants/[id] - Partially update a restaurant
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { error, user } = await requireAuth();

        if (error || !user) return error;

        const { id } = await params;

        // Check if user has access to this restaurant
        const hasAccess = await canAccessRestaurant(user, id);

        if (!hasAccess) {
            return NextResponse.json(
                {
                    error: 'Forbidden: You do not have access to this restaurant',
                },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Check if restaurant exists
        const existingRestaurant = await db.restaurant.findUnique({
            where: { id },
        });

        if (!existingRestaurant) {
            return NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404 }
            );
        }

        log.info('restaurant PATCH', { id, userId: user.id });

        // Build update data dynamically based on provided fields
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {};

        // List of allowed fields to update (REMOVED menu-related fields)
        const allowedFields = [
            'name',
            'description',
            'address',
            'phone',
            'email',
            'defaultLanguage',
            'timezone',
            'logoUrl',
            'themeColor',
        ];

        // Only include fields that are present in the request body
        allowedFields.forEach((field) => {
            if (field in body) {
                updateData[field] = body[field];
            }
        });

        // Validate fields if provided
        if (updateData.email && !isValidEmail(updateData.email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        if (updateData.phone && !isValidPhone(updateData.phone)) {
            return NextResponse.json(
                { error: 'Invalid phone format' },
                { status: 400 }
            );
        }

        // Update the restaurant with only the provided fields
        const updatedRestaurant = await db.restaurant.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updatedRestaurant);
    } catch (error) {
        log.error('restaurant PATCH error', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/restaurants/[id] - Delete a restaurant
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { error, user } = await requireAuth();

        if (error || !user) return error;

        // Additional check: Only ADMIN users can delete restaurants
        if (user.role !== 'ADMIN') {
            return NextResponse.json(
                {
                    error: 'Forbidden: Only administrators can delete restaurants',
                },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Check if restaurant exists
        const existingRestaurant = await db.restaurant.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        managers: true,
                        orders: true,
                        menus: true, // ADDED
                    },
                },
            },
        });

        if (!existingRestaurant) {
            return NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404 }
            );
        }

        // Optional: Prevent deletion if restaurant has active orders
        if (existingRestaurant._count.orders > 0) {
            return NextResponse.json(
                { error: 'Cannot delete restaurant with existing orders' },
                { status: 400 }
            );
        }

        log.info('restaurant DELETE', { id, userId: user.id });

        // Delete the restaurant (cascade will handle related records including menus)
        await db.restaurant.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: 'Restaurant deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        log.error('restaurant DELETE error', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Validation helper functions
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
    // Basic phone validation - adjust regex based on your requirements
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}
