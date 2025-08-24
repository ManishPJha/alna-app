import { getSession } from '@/features/auth';
import { db } from '@/lib/db';
import { createServiceContext } from '@/utils/service-utils';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('MenuService');

// Define types for the different query results we might get
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

type MenuItemWithCategory = Prisma.MenuItemGetPayload<{
    include: {
        category: {
            include: {
                menuItems: true;
                restaurant: {
                    include: {
                        categories: {
                            include: {
                                menuItems: true;
                            };
                        };
                        faqs: true;
                    };
                };
            };
        };
    };
}>;

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = params;
        log.info('Individual menu GET', { id });

        let restaurant: RestaurantWithRelations | null = null;

        // Handle different ID formats
        if (id.startsWith('menu-')) {
            // If ID starts with 'menu-', extract restaurant ID
            const restaurantId = id.replace('menu-', '');
            restaurant = await db.restaurant.findUnique({
                where: { id: restaurantId },
                include: {
                    categories: {
                        orderBy: { displayOrder: 'asc' },
                        include: {
                            menuItems: {
                                orderBy: { displayOrder: 'asc' },
                            },
                        },
                    },
                    faqs: {
                        where: { isActive: true },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
        } else {
            // Try to find by restaurant ID directly
            restaurant = await db.restaurant.findUnique({
                where: { id },
                include: {
                    categories: {
                        orderBy: { displayOrder: 'asc' },
                        include: {
                            menuItems: {
                                orderBy: { displayOrder: 'asc' },
                            },
                        },
                    },
                    faqs: {
                        where: { isActive: true },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });

            // If not found by restaurant ID, try to find by menu item ID (legacy support)
            if (!restaurant) {
                const menuItem: MenuItemWithCategory | null =
                    await db.menuItem.findUnique({
                        where: { id },
                        include: {
                            category: {
                                include: {
                                    menuItems: {
                                        orderBy: { displayOrder: 'asc' },
                                    },
                                    restaurant: {
                                        include: {
                                            categories: {
                                                orderBy: {
                                                    displayOrder: 'asc',
                                                },
                                                include: {
                                                    menuItems: {
                                                        orderBy: {
                                                            displayOrder: 'asc',
                                                        },
                                                    },
                                                },
                                            },
                                            faqs: {
                                                where: { isActive: true },
                                                orderBy: { createdAt: 'desc' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    });

                if (menuItem?.category?.restaurant) {
                    restaurant = menuItem.category.restaurant;

                    // Return in legacy format for backward compatibility
                    const legacyResponse = {
                        menu: {
                            id: menuItem.id,
                            name: menuItem.name,
                            description: menuItem.description,
                            restaurantId: menuItem.restaurantId,
                            categoryId: menuItem.categoryId,
                            isAvailable: menuItem.isAvailable,
                            category: {
                                id: menuItem.category.id,
                                name: menuItem.category.name,
                                description: menuItem.category.description,
                                displayOrder: menuItem.category.displayOrder,
                                isActive: menuItem.category.isActive,
                                menuItems: menuItem.category.menuItems.map(
                                    (item) => ({
                                        id: item.id,
                                        name: item.name,
                                        description: item.description,
                                        price: parseFloat(
                                            item.price.toString()
                                        ),
                                        isVegetarian: item.isVegetarian,
                                        isVegan: item.isVegan,
                                        isGlutenFree: item.isGlutenFree,
                                        isSpicy: item.isSpicy,
                                        isAvailable: item.isAvailable,
                                        displayOrder: item.displayOrder,
                                        categoryId: item.categoryId,
                                    })
                                ),
                                restaurant: {
                                    id: restaurant.id,
                                    name: restaurant.name,
                                    description: restaurant.description,
                                    menuTheme: restaurant.menuTheme,
                                },
                            },
                        },
                    };

                    return NextResponse.json(legacyResponse);
                }
            }
        }

        if (!restaurant) {
            return NextResponse.json(
                { error: 'Menu not found' },
                { status: 404 }
            );
        }

        // Transform restaurant data into menu format
        const menuResponse = {
            id: `menu-${restaurant.id}`,
            name: `${restaurant.name} Menu`,
            description: restaurant.description,
            restaurantId: restaurant.id,
            isActive: restaurant.isMenuPublished,
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
                    price: parseFloat(item.price.toString()), // Convert Decimal to number
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
            theme: restaurant.menuTheme || {
                primaryColor: '#1f2937',
                backgroundColor: '#f9fafb',
                accentColor: '#ef4444',
                fontFamily: 'Inter',
            },
            restaurant: {
                id: restaurant.id,
                name: restaurant.name,
                description: restaurant.description,
                menuTheme: restaurant.menuTheme,
            },
            createdAt: restaurant.createdAt,
            updatedAt: restaurant.updatedAt,
        };

        return NextResponse.json({
            data: menuResponse,
            success: true,
        });
    } catch (error) {
        log.error('Individual menu GET error', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = params;
        const data = await request.json();

        const {
            name,
            description,
            isActive,
            categories = [],
            faqs = [],
            theme,
        } = data;

        log.info('Updating menu', { id, categoryCount: categories.length });

        // Extract restaurant ID from menu ID
        const restaurantId = id.startsWith('menu-')
            ? id.replace('menu-', '')
            : id;

        // Verify restaurant exists
        const restaurant = await db.restaurant.findUnique({
            where: { id: restaurantId },
        });

        if (!restaurant) {
            return NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404 }
            );
        }

        const result = await db.$transaction(async (prisma) => {
            // Update restaurant with menu info
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

            // Clear existing data (simplified approach)
            await prisma.menuItem.deleteMany({
                where: { restaurantId },
            });
            await prisma.menuCategory.deleteMany({
                where: { restaurantId },
            });
            await prisma.fAQ.deleteMany({
                where: { restaurantId },
            });

            // Create new categories and items
            const createdCategories = [];
            const createdItems = [];

            for (const category of categories) {
                const createdCategory = await prisma.menuCategory.create({
                    data: {
                        name: category.name,
                        description: category.description || '',
                        displayOrder: category.displayOrder || 0,
                        isActive: category.isActive !== false,
                        restaurantId,
                    },
                });
                createdCategories.push(createdCategory);

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
                                restaurantId,
                                categoryId: createdCategory.id,
                            },
                        });
                        createdItems.push(createdItem);
                    }
                }
            }

            // Handle FAQs
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
                categories: createdCategories,
                items: createdItems,
                faqs: createdFaqs,
            };
        });

        return NextResponse.json({
            success: true,
            message: 'Menu updated successfully',
            data: {
                id: `menu-${restaurantId}`,
                categoriesUpdated: result.categories.length,
                itemsUpdated: result.items.length,
                faqsUpdated: result.faqs.length,
            },
        });
    } catch (error) {
        log.error('Menu update error', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
