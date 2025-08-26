/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@/features/auth/handlers';
import { db } from '@/lib/db';
import { requireAuth, requireRestaurantAccess } from '@/utils/auth-utils';
import { createServiceContext } from '@/utils/service-utils';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('MenuService');

// Define the type for restaurant with includes
type RestaurantWithRelations = Prisma.RestaurantGetPayload<{
    include: {
        categories: {
            include: {
                menuItems: true;
            };
        };
        faqs: true;
    };
}>;

export async function GET(request: NextRequest) {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) return error;

        if (user.role !== 'ADMIN') {
            const { error: restaurantError } = await requireRestaurantAccess(
                user.restaurantId!
            );
            if (restaurantError) return restaurantError;
        }

        const searchParams = request.nextUrl.searchParams;
        const page = Number(searchParams.get('page')) || 1;
        const limit = Number(searchParams.get('limit')) || 10;
        const search = searchParams.get('search');

        // const sortBy = searchParams.get('sortBy') || 'updatedAt';
        // const sortOrder = searchParams.get('sortOrder') || 'desc';

        log.info('menu GET', { page, limit, search });

        const whereClause: Prisma.RestaurantWhereInput = {};

        // Manager role filter
        if (user.role === 'MANAGER' && user.restaurantId) {
            whereClause.id = user.restaurantId;
        }

        // Search filter
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                {
                    managers: {
                        some: {
                            OR: [
                                {
                                    name: {
                                        contains: search,
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    email: {
                                        contains: search,
                                        mode: 'insensitive',
                                    },
                                },
                            ],
                        },
                    },
                },
            ];
        }

        const restaurants = await db.restaurant.findMany({
            where: whereClause,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { updatedAt: 'desc' },
            include: {
                categories: {
                    orderBy: { displayOrder: 'asc' },
                    include: {
                        menuItems: { orderBy: { displayOrder: 'asc' } },
                    },
                },
                faqs: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'desc' },
                },
                managers: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        const totalRestaurants = await db.restaurant.count({
            where: whereClause,
        });

        const menus = restaurants.map((restaurant) => ({
            id: `menu-${restaurant.id}`,
            name: `${restaurant.name} Menu`,
            description: restaurant.description,
            restaurantId: restaurant.id,
            isActive: restaurant.isMenuPublished,
            restaurant: {
                id: restaurant.id,
                name: restaurant.name,
                description: restaurant.description,
                menuTheme: restaurant.menuTheme,
            },
            categories: restaurant.categories.map((category) => ({
                id: category.id,
                name: category.name,
                description: category.description,
                displayOrder: category.displayOrder,
                isActive: category.isActive,
                items: category.menuItems.map((item) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    price: parseFloat(item.price.toString()),
                    isVegetarian: item.isVegetarian,
                    isVegan: item.isVegan,
                    isGlutenFree: item.isGlutenFree,
                    isSpicy: item.isSpicy,
                    isAvailable: item.isAvailable,
                    displayOrder: item.displayOrder,
                    categoryId: item.categoryId,
                })),
            })),
            faqs: restaurant.faqs.map((faq) => ({
                id: faq.id,
                question: faq.question,
                answer: faq.answer,
            })),
            theme: restaurant.menuTheme ?? {
                primaryColor: '#1f2937',
                backgroundColor: '#f9fafb',
                accentColor: '#ef4444',
                fontFamily: 'Inter',
            },
            createdAt: restaurant.createdAt,
            updatedAt: restaurant.updatedAt,
        }));

        return NextResponse.json({
            data: {
                menus,
                pagination: {
                    total: totalRestaurants,
                    page,
                    limit,
                    totalPages: Math.ceil(totalRestaurants / limit),
                    hasMore: page < Math.ceil(totalRestaurants / limit),
                },
            },
            success: true,
        });
    } catch (error) {
        log.error('menu GET error', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { error } = await requireRestaurantAccess(
            session.user.restaurantId!
        );

        if (error) return error;

        const data = await request.json();
        const {
            name,
            description,
            restaurantId,
            isActive,
            categories = [],
            faqs = [],
            theme,
        } = data;

        // Enhanced validation
        const validationErrors = [];
        if (!name || name.trim() === '') {
            validationErrors.push('Menu name is required');
        }
        if (!restaurantId || restaurantId.trim() === '') {
            validationErrors.push('Restaurant selection is required');
        }

        if (validationErrors.length > 0) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationErrors,
                    success: false,
                },
                { status: 400 }
            );
        }

        // Verify restaurant exists
        const restaurant = await db.restaurant.findUnique({
            where: { id: restaurantId },
        });

        if (!restaurant) {
            return NextResponse.json(
                { error: 'Restaurant not found', success: false },
                { status: 404 }
            );
        }

        log.info('Creating menu', {
            name,
            restaurantId,
            categoryCount: categories.length,
            faqCount: faqs.length,
        });

        const result = await db.$transaction(async (prisma) => {
            // Update restaurant with menu info and theme
            const updatedRestaurant = await prisma.restaurant.update({
                where: { id: restaurantId },
                data: {
                    description: description || restaurant.description,
                    menuTheme: theme,
                    isMenuPublished: isActive !== false,
                    menuVersion: restaurant.menuVersion + 1,
                    lastMenuUpdate: new Date(),
                },
            });

            // Clear existing data first (simpler approach)
            await prisma.menuItem.deleteMany({
                where: { restaurantId },
            });
            await prisma.menuCategory.deleteMany({
                where: { restaurantId },
            });
            await prisma.fAQ.deleteMany({
                where: { restaurantId },
            });

            // Create categories
            const createdCategories = [];
            for (const category of categories) {
                const createdCategory = await prisma.menuCategory.create({
                    data: {
                        name: category.name,
                        description: category.description || '',
                        displayOrder: category.displayOrder || 0,
                        isActive: category.isActive !== false,
                        isVisible: true,
                        restaurantId,
                    },
                });
                createdCategories.push({
                    original: category,
                    created: createdCategory,
                });
            }

            // Create menu items
            const createdItems = [];
            for (const {
                original: category,
                created: createdCategory,
            } of createdCategories) {
                if (category.items && Array.isArray(category.items)) {
                    for (const item of category.items) {
                        const createdItem = await prisma.menuItem.create({
                            data: {
                                name: item.name,
                                description: item.description || '',
                                price: new Prisma.Decimal(item.price || 0),
                                isVegetarian: item.isVegetarian || false,
                                isVegan: item.isVegan || false,
                                isGlutenFree: item.isGlutenFree || false,
                                isSpicy: item.isSpicy || false,
                                isAvailable: item.isAvailable !== false,
                                spiceLevel: item.spiceLevel || 0,
                                isBestseller: item.isBestseller || false,
                                displayOrder: item.displayOrder || 0,
                                isVisible: true,
                                restaurantId,
                                categoryId: createdCategory.id,
                            },
                        });
                        createdItems.push(createdItem);
                    }
                }
            }

            // Create FAQs
            const createdFaqs = [];
            if (faqs && Array.isArray(faqs)) {
                for (const faq of faqs) {
                    if (faq.question && faq.answer) {
                        const createdFaq = await prisma.fAQ.create({
                            data: {
                                question: faq.question,
                                answer: faq.answer,
                                restaurantId,
                                isActive: true,
                            },
                        });
                        createdFaqs.push(createdFaq);
                    }
                }
            }

            return {
                restaurant: updatedRestaurant,
                categories: createdCategories.map((c) => c.created),
                items: createdItems,
                faqs: createdFaqs,
                stats: {
                    categoriesCreated: createdCategories.length,
                    itemsCreated: createdItems.length,
                    faqsCreated: createdFaqs.length,
                },
            };
        });

        // Return the created menu in the expected format
        const createdMenu = {
            id: `menu-${restaurantId}`,
            name: name,
            description: description,
            restaurantId: restaurantId,
            isActive: isActive,
            categories: result.categories.map((cat) => {
                const originalCategory = categories.find(
                    (c: any) => c.name === cat.name
                );
                return {
                    id: cat.id,
                    name: cat.name,
                    description: cat.description,
                    displayOrder: cat.displayOrder,
                    isActive: cat.isActive,
                    items: result.items
                        .filter((item) => item.categoryId === cat.id)
                        .map((item) => ({
                            id: item.id,
                            name: item.name,
                            description: item.description,
                            price: parseFloat(item.price.toString()),
                            isVegetarian: item.isVegetarian,
                            isVegan: item.isVegan,
                            isGlutenFree: item.isGlutenFree,
                            isSpicy: item.isSpicy,
                            isAvailable: item.isAvailable,
                            displayOrder: item.displayOrder,
                            categoryId: item.categoryId,
                        })),
                };
            }),
            faqs: result.faqs.map((faq) => ({
                id: faq.id,
                question: faq.question,
                answer: faq.answer,
            })),
            theme: theme,
            restaurant: {
                id: result.restaurant.id,
                name: result.restaurant.name,
                menuTheme: result.restaurant.menuTheme,
            },
        };

        return NextResponse.json(
            {
                success: true,
                message: 'Menu created successfully',
                data: createdMenu,
                stats: result.stats,
            },
            { status: 201 }
        );
    } catch (error) {
        log.error('menu POST error', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                success: false,
                details:
                    process.env.NODE_ENV === 'development'
                        ? (error as Error).message
                        : undefined,
            },
            { status: 500 }
        );
    }
}
