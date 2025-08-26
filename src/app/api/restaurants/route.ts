import { db } from '@/lib/db';
import { requireAuth } from '@/utils/auth-utils';
import { createServiceContext } from '@/utils/service-utils';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('RestaurantService');

export async function GET(request: NextRequest) {
    try {
        const { error, user } = await requireAuth();

        if (error || !user) return error;

        const searchParams = request.nextUrl.searchParams;

        const page = Number(searchParams.get('page')) || 1;
        const limit = Number(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        const sortOrder =
            searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
        const sortBy =
            searchParams.get('sortBy') === 'undefined'
                ? 'createdAt'
                : searchParams.get('sortBy') || 'createdAt';

        log.info('Fetching restaurants', {
            userId: user.id,
            role: user.role,
            page,
            limit,
        });

        // Build where clause based on user role
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        // Add search filter if provided
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Role-based filtering
        if (user.role === 'MANAGER') {
            // Managers can only see their assigned restaurant
            if (!user.restaurantId) {
                return NextResponse.json({
                    restaurants: [],
                    pagination: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0,
                        hasMore: false,
                    },
                });
            }
            where.id = user.restaurantId;
        } else if (user.role === 'USER') {
            // Regular users shouldn't access this endpoint
            return NextResponse.json(
                {
                    error: 'Forbidden: You do not have access to view restaurants',
                },
                { status: 403 }
            );
        }
        // ADMINs can see all restaurants (no additional where clause needed)

        // Get total count for pagination
        const totalRestaurants = await db.restaurant.count({ where });

        // Fetch restaurants with pagination
        const restaurants = await db.restaurant.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
            include: {
                _count: {
                    select: {
                        managers: true,
                        qrCodes: true,
                        menuItems: true,
                        categories: true,
                        orders: true,
                    },
                },
                // Include managers info for ADMIN users
                ...(user.role === 'ADMIN' && {
                    managers: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            isActive: true,
                        },
                        take: 5, // Limit to first 5 managers for list view
                    },
                }),
            },
        });

        // Transform the response to include counts as flat properties
        const transformedRestaurants = restaurants.map((restaurant) => ({
            id: restaurant.id,
            name: restaurant.name,
            description: restaurant.description,
            address: restaurant.address,
            phone: restaurant.phone,
            email: restaurant.email,
            defaultLanguage: restaurant.defaultLanguage,
            timezone: restaurant.timezone,
            logoUrl: restaurant.logoUrl,
            themeColor: restaurant.themeColor,
            menuTheme: restaurant.menuTheme,
            isMenuPublished: restaurant.isMenuPublished,
            menuVersion: restaurant.menuVersion,
            lastMenuUpdate: restaurant.lastMenuUpdate,
            createdAt: restaurant.createdAt,
            updatedAt: restaurant.updatedAt,
            // Flatten counts
            managersCount: restaurant._count.managers,
            qrCodesCount: restaurant._count.qrCodes,
            menuItemsCount: restaurant._count.menuItems,
            categoriesCount: restaurant._count.categories,
            ordersCount: restaurant._count.orders,
            // Include managers for ADMIN view
            ...(user.role === 'ADMIN' &&
                restaurant.managers && {
                    managers: restaurant.managers,
                }),
        }));

        const pagination = {
            total: totalRestaurants,
            page,
            limit,
            totalPages: Math.ceil(totalRestaurants / limit),
            hasMore: page < Math.ceil(totalRestaurants / limit),
        };

        log.info('Restaurants fetched successfully', {
            count: transformedRestaurants.length,
            total: totalRestaurants,
            userId: user.id,
        });

        return NextResponse.json({
            restaurants: transformedRestaurants,
            pagination,
        });
    } catch (error) {
        log.error('Error fetching restaurants', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { error, user } = await requireAuth();

        if (error || !user) return error;

        // Only ADMIN users can create new restaurants
        if (user.role !== 'ADMIN') {
            return NextResponse.json(
                {
                    error: 'Forbidden: Only administrators can create restaurants',
                },
                { status: 403 }
            );
        }

        const body = await request.json();
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
            menuTheme,
            isMenuPublished,
        } = body;

        // Validate required fields
        if (!name || !address) {
            return NextResponse.json(
                { error: 'Name and address are required' },
                { status: 400 }
            );
        }

        // Validate email format if provided
        if (email && !isValidEmail(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate phone format if provided
        if (phone && !isValidPhone(phone)) {
            return NextResponse.json(
                { error: 'Invalid phone format' },
                { status: 400 }
            );
        }

        log.info('Creating restaurant', {
            name,
            address,
            userId: user.id,
        });

        // Check if restaurant with same name and address already exists
        const existingRestaurant = await db.restaurant.findFirst({
            where: {
                name,
                address,
            },
        });

        if (existingRestaurant) {
            return NextResponse.json(
                {
                    error: 'A restaurant with this name and address already exists',
                },
                { status: 409 }
            );
        }

        // Create the restaurant
        const restaurant = await db.restaurant.create({
            data: {
                name,
                address,
                description,
                phone,
                email,
                defaultLanguage: defaultLanguage || 'en',
                timezone: timezone || 'UTC',
                logoUrl,
                themeColor: themeColor || '#6366f1',
                menuTheme: menuTheme || {},
                isMenuPublished: isMenuPublished || false,
                menuVersion: 1,
            },
            include: {
                _count: {
                    select: {
                        managers: true,
                        qrCodes: true,
                        menuItems: true,
                        categories: true,
                        orders: true,
                    },
                },
            },
        });

        // Create default menu categories for the new restaurant
        await createDefaultCategories(restaurant.id);

        // Log successful creation
        log.info('Restaurant created successfully', {
            restaurantId: restaurant.id,
            name: restaurant.name,
            createdBy: user.id,
        });

        // Transform response
        const response = {
            ...restaurant,
            managersCount: restaurant._count.managers,
            qrCodesCount: restaurant._count.qrCodes,
            menuItemsCount: restaurant._count.menuItems,
            categoriesCount: restaurant._count.categories,
            ordersCount: restaurant._count.orders,
            _count: undefined,
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        log.error('Error creating restaurant', error);

        // Check for unique constraint violations
        if (
            error instanceof Error &&
            error.message.includes('Unique constraint')
        ) {
            return NextResponse.json(
                { error: 'A restaurant with this email already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Helper function to create default categories for a new restaurant
async function createDefaultCategories(restaurantId: string) {
    const defaultCategories = [
        {
            name: 'Starters',
            displayOrder: 1,
            description: 'Appetizers and small plates',
        },
        {
            name: 'Main Course',
            displayOrder: 2,
            description: 'Hearty main dishes',
        },
        {
            name: 'Desserts',
            displayOrder: 3,
            description: 'Sweet treats and desserts',
        },
        {
            name: 'Beverages',
            displayOrder: 4,
            description: 'Drinks and refreshments',
        },
    ];

    try {
        await db.menuCategory.createMany({
            data: defaultCategories.map((category) => ({
                ...category,
                restaurantId,
                isActive: true,
                isVisible: true,
            })),
        });
        log.info('Default categories created', { restaurantId });
    } catch (error) {
        log.error('Error creating default categories', error);
        // Don't throw - restaurant creation should still succeed
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

// Optional: Bulk operations for ADMIN users
export async function PATCH(request: NextRequest) {
    try {
        const { error, user } = await requireAuth();

        if (error || !user) return error;

        // Only ADMIN users can perform bulk operations
        if (user.role !== 'ADMIN') {
            return NextResponse.json(
                {
                    error: 'Forbidden: Only administrators can perform bulk operations',
                },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { action, restaurantIds } = body;

        if (!action || !restaurantIds || !Array.isArray(restaurantIds)) {
            return NextResponse.json(
                { error: 'Action and restaurantIds array are required' },
                { status: 400 }
            );
        }

        log.info('Performing bulk operation', {
            action,
            count: restaurantIds.length,
            userId: user.id,
        });

        let result;

        switch (action) {
            case 'publish':
                result = await db.restaurant.updateMany({
                    where: { id: { in: restaurantIds } },
                    data: {
                        isMenuPublished: true,
                        lastMenuUpdate: new Date(),
                    },
                });
                break;

            case 'unpublish':
                result = await db.restaurant.updateMany({
                    where: { id: { in: restaurantIds } },
                    data: { isMenuPublished: false },
                });
                break;

            case 'delete':
                // Check if any restaurants have orders
                const restaurantsWithOrders = await db.restaurant.findMany({
                    where: {
                        id: { in: restaurantIds },
                        orders: { some: {} },
                    },
                    select: { id: true, name: true },
                });

                if (restaurantsWithOrders.length > 0) {
                    return NextResponse.json(
                        {
                            error: 'Cannot delete restaurants with existing orders',
                            restaurants: restaurantsWithOrders,
                        },
                        { status: 400 }
                    );
                }

                result = await db.restaurant.deleteMany({
                    where: { id: { in: restaurantIds } },
                });
                break;

            default:
                return NextResponse.json(
                    {
                        error: 'Invalid action. Allowed actions: publish, unpublish, delete',
                    },
                    { status: 400 }
                );
        }

        log.info('Bulk operation completed', {
            action,
            affected: result.count,
            userId: user.id,
        });

        return NextResponse.json({
            message: `Successfully ${action}ed ${result.count} restaurant(s)`,
            affected: result.count,
        });
    } catch (error) {
        log.error('Error in bulk operation', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// export async function POST(request: NextRequest) {
//     try {
//         const session = await getSession();

//         if (!session?.user) {
//             return NextResponse.json(
//                 { error: 'Unauthorized' },
//                 { status: 401 }
//             );
//         }

//         const body = await request.json();
//         const {
//             name,
//             description,
//             address,
//             phone,
//             email,
//             defaultLanguage,
//             timezone,
//             logoUrl,
//             themeColor,
//         } = body;

//         if (!name || !address) {
//             return NextResponse.json(
//                 { error: 'name and address are required' },
//                 { status: 400 }
//             );
//         }

//         log.info('restaurant POST', body);

//         const restaurant = await db.restaurant.create({
//             data: {
//                 name,
//                 address,
//                 description,
//                 phone,
//                 email,
//                 defaultLanguage,
//                 timezone,
//                 logoUrl,
//                 themeColor,
//             },
//         });

//         return NextResponse.json(restaurant);
//     } catch (error) {
//         log.error('restaurant POST error', error);

//         return NextResponse.json(
//             { error: 'Internal Server Error' },
//             { status: 500 }
//         );
//     }
// }
