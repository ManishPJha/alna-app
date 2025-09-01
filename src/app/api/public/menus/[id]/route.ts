import { db } from '@/lib/db';
import { createServiceContext } from '@/utils/service-utils';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('PublicMenuService');

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        log.info('Public menu GET', { id });

        // Find published menu
        const menu = await db.menu.findFirst({
            where: {
                id,
                isActive: true,
                isPublished: true,
            },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        logoUrl: true,
                        themeColor: true,
                    },
                },
                categories: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' },
                    include: {
                        menuItems: {
                            where: {
                                isAvailable: true,
                                isVisible: true,
                            },
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

        if (!menu) {
            return NextResponse.json(
                { error: 'Menu not found or not published' },
                { status: 404 }
            );
        }

        // Transform menu data for public consumption
        const publicMenuData = {
            id: menu.id,
            name: menu.name,
            description: menu.description,
            restaurant: menu.restaurant,
            categories: menu.categories.map((category) => ({
                id: category.id,
                name: category.name,
                description: category.description,
                displayOrder: category.displayOrder,
                items: category.menuItems.map((item) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    price: parseFloat(item.price.toString()),
                    imageUrl: item.imageUrl,
                    preparationTime: item.preparationTime,
                    calories: item.calories,
                    isVegetarian: item.isVegetarian,
                    isVegan: item.isVegan,
                    isGlutenFree: item.isGlutenFree,
                    isSpicy: item.isSpicy,
                    spiceLevel: item.spiceLevel,
                    isBestseller: item.isBestseller,
                    displayOrder: item.displayOrder,
                    tags: item.tags,
                    nutritionInfo: item.nutritionInfo,
                })),
            })),
            faqs: menu.faqs.map((faq) => ({
                id: faq.id,
                question: faq.question,
                answer: faq.answer,
                category: faq.category,
            })),
            theme: menu.theme || {
                primaryColor: '#1f2937',
                backgroundColor: '#f9fafb',
                accentColor: '#ef4444',
                fontFamily: 'Inter',
            },
        };

        // Track analytics (optional)
        try {
            await db.menuAnalytics.create({
                data: {
                    restaurantId: menu.restaurantId,
                    menuItemId: null,
                    eventType: 'VIEW',
                    metadata: {
                        menuId: menu.id,
                        viewType: 'public',
                    },
                },
            });
        } catch (analyticsError) {
            // Don't fail the request if analytics fails
            log.error('Analytics tracking failed', analyticsError);
        }

        return NextResponse.json(publicMenuData);
    } catch (error) {
        log.error('Public menu GET error', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
