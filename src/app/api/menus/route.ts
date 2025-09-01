import { db } from '@/lib/db';
import { requireAuth } from '@/utils/auth-utils';
import { createServiceContext } from '@/utils/service-utils';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('MenuService');

export async function GET(request: NextRequest) {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) return error;

        if (user.role === 'MANAGER' && !user.restaurantId) {
            return NextResponse.json(
                { error: 'No restaurant assigned to this manager' },
                { status: 403 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const page = Number(searchParams.get('page')) || 1;
        const limit = Number(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        const finalSortBy = ['name', 'createdAt', 'updatedAt'].includes(sortBy)
            ? sortBy
            : 'createdAt';

        log.info('menus GET', { page, limit, search });

        const whereClause: Prisma.MenuWhereInput = {};

        // Manager role filter - only see menus for their restaurant
        if (user.role === 'MANAGER') {
            whereClause.restaurantId = user.restaurantId!;
        }

        // Search filter
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                {
                    restaurant: {
                        name: { contains: search, mode: 'insensitive' },
                    },
                },
            ];
        }

        const menus = await db.menu.findMany({
            where: whereClause,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { [finalSortBy]: sortOrder },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                categories: {
                    orderBy: { displayOrder: 'asc' },
                    include: {
                        menuItems: {
                            orderBy: { displayOrder: 'asc' },
                            where: {
                                restaurantId: whereClause.restaurantId as
                                    | string
                                    | undefined,
                            },
                        },
                    },
                },
                faqs: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        const totalMenus = await db.menu.count({ where: whereClause });

        const transformedMenus = menus.map((menu) => ({
            id: menu.id,
            name: menu.name,
            description: menu.description,
            restaurantId: menu.restaurantId,
            isActive: menu.isActive,
            isPublished: menu.isPublished,
            restaurant: menu.restaurant,
            categories: menu.categories.map((category) => ({
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
            faqs: menu.faqs.map((faq) => ({
                id: faq.id,
                question: faq.question,
                answer: faq.answer,
            })),
            theme: menu.theme || {
                primaryColor: '#1f2937',
                backgroundColor: '#f9fafb',
                accentColor: '#ef4444',
                fontFamily: 'Inter',
            },
            createdAt: menu.createdAt,
            updatedAt: menu.updatedAt,
        }));

        return NextResponse.json({
            data: {
                menus: transformedMenus,
                pagination: {
                    total: totalMenus,
                    page,
                    limit,
                    totalPages: Math.ceil(totalMenus / limit),
                    hasMore: page < Math.ceil(totalMenus / limit),
                },
            },
            success: true,
        });
    } catch (error) {
        log.error('menus GET error', error);
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

        const data = await request.json();
        const {
            name,
            description,
            restaurantId,
            isActive = true,
            isPublished = true,
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

        // Check restaurant access for managers
        if (user.role === 'MANAGER') {
            if (!user.restaurantId || user.restaurantId !== restaurantId) {
                return NextResponse.json(
                    {
                        error: 'Access denied to this restaurant',
                        success: false,
                    },
                    { status: 403 }
                );
            }
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
            // Create the menu
            const createdMenu = await prisma.menu.create({
                data: {
                    name,
                    description,
                    restaurantId,
                    isActive,
                    isPublished,
                    theme,
                },
            });

            // Create categories
            const createdCategories = [];
            const createdItems = [];

            for (const category of categories) {
                const createdCategory = await prisma.menuCategory.create({
                    data: {
                        name: category.name,
                        description: category.description || '',
                        displayOrder: category.displayOrder || 0,
                        isActive: category.isActive !== false,
                        isVisible: true,
                        menuId: createdMenu.id,
                    },
                });
                createdCategories.push(createdCategory);

                // Create items for this category
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
                                menuId: createdMenu.id,
                                isActive: true,
                            },
                        });
                        createdFaqs.push(createdFaq);
                    }
                }
            }

            return {
                menu: createdMenu,
                categories: createdCategories,
                items: createdItems,
                faqs: createdFaqs,
            };
        });

        // Transform response
        const createdMenuResponse = {
            id: result.menu.id,
            name: result.menu.name,
            description: result.menu.description,
            restaurantId: result.menu.restaurantId,
            isActive: result.menu.isActive,
            isPublished: result.menu.isPublished,
            categories: result.categories.map((cat) => ({
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
            })),
            faqs: result.faqs.map((faq) => ({
                id: faq.id,
                question: faq.question,
                answer: faq.answer,
            })),
            theme: result.menu.theme,
            createdAt: result.menu.createdAt,
            updatedAt: result.menu.updatedAt,
        };

        return NextResponse.json(
            {
                success: true,
                message: 'Menu created successfully',
                data: createdMenuResponse,
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
