import { db } from '@/lib/db';
import { createServiceContext } from '@/utils/service-utils';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('PublicMenuService');

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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        log.info('Public menu GET', { id });

        let restaurant: RestaurantWithRelations | null = null;

        // Handle different ID formats
        if (id.startsWith('menu-')) {
            // If ID starts with 'menu-', extract restaurant ID
            const restaurantId = id.replace('menu-', '');
            restaurant = await db.restaurant.findUnique({
                where: {
                    id: restaurantId,
                    isMenuPublished: true, // Only return published menus
                },
                include: {
                    categories: {
                        where: { isActive: true }, // Only active categories
                        orderBy: { displayOrder: 'asc' },
                        include: {
                            menuItems: {
                                where: { isAvailable: true }, // Only available items
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
                where: {
                    id,
                    isMenuPublished: true, // Only return published menus
                },
                include: {
                    categories: {
                        where: { isActive: true }, // Only active categories
                        orderBy: { displayOrder: 'asc' },
                        include: {
                            menuItems: {
                                where: { isAvailable: true }, // Only available items
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
        }

        if (!restaurant) {
            return NextResponse.json(
                { error: 'Menu not found or not published' },
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
            createdAt: restaurant.createdAt,
            updatedAt: restaurant.updatedAt,
        };

        return NextResponse.json(menuResponse);
    } catch (error) {
        log.error('Public menu GET error', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
