import { db } from '@/lib/db';
import { requireAuth } from '@/utils/auth-utils';
import { createServiceContext } from '@/utils/service-utils';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('MenuService');

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) return error;

        const { id } = await params;
        const data = await request.json();
        const { name, description, restaurantId } = data;

        log.info('Duplicating menu', { id, newName: name });

        // Verify original menu exists
        const originalMenu = await db.menu.findUnique({
            where: { id },
            include: {
                categories: {
                    include: {
                        menuItems: true,
                    },
                },
                faqs: true,
            },
        });

        if (!originalMenu) {
            return NextResponse.json(
                { error: 'Original menu not found' },
                { status: 404 }
            );
        }

        // Check access for managers
        if (user.role === 'MANAGER') {
            if (
                !user.restaurantId ||
                user.restaurantId !== originalMenu.restaurantId
            ) {
                return NextResponse.json(
                    { error: 'Access denied to this menu' },
                    { status: 403 }
                );
            }

            // If restaurantId is provided and different, check access to target restaurant
            if (restaurantId && restaurantId !== user.restaurantId) {
                return NextResponse.json(
                    { error: 'Access denied to target restaurant' },
                    { status: 403 }
                );
            }
        }

        // Use original restaurant if no target specified
        const targetRestaurantId = restaurantId || originalMenu.restaurantId;

        // Verify target restaurant exists
        const targetRestaurant = await db.restaurant.findUnique({
            where: { id: targetRestaurantId },
        });

        if (!targetRestaurant) {
            return NextResponse.json(
                { error: 'Target restaurant not found' },
                { status: 404 }
            );
        }

        const result = await db.$transaction(async (prisma) => {
            // Create duplicate menu with proper JSON handling
            const duplicatedMenu = await prisma.menu.create({
                data: {
                    name: name || `${originalMenu.name} (Copy)`,
                    description: description || originalMenu.description,
                    restaurantId: targetRestaurantId,
                    isActive: true, // Start as active
                    isPublished: true, // Start as published
                    theme:
                        (originalMenu.theme as Prisma.InputJsonValue) ||
                        undefined,
                },
            });

            // Duplicate categories and items
            const categoryMapping: Record<string, string> = {};

            for (const category of originalMenu.categories) {
                const duplicatedCategory = await prisma.menuCategory.create({
                    data: {
                        name: category.name,
                        description: category.description,
                        displayOrder: category.displayOrder,
                        isActive: category.isActive,
                        isVisible: category.isVisible,
                        iconUrl: category.iconUrl,
                        menuId: duplicatedMenu.id,
                    },
                });

                categoryMapping[category.id] = duplicatedCategory.id;

                // Duplicate menu items for this category
                for (const item of category.menuItems) {
                    await prisma.menuItem.create({
                        data: {
                            name: item.name,
                            description: item.description,
                            price: item.price,
                            imageUrl: item.imageUrl,
                            preparationTime: item.preparationTime,
                            calories: item.calories,
                            isVegetarian: item.isVegetarian,
                            isVegan: item.isVegan,
                            isGlutenFree: item.isGlutenFree,
                            isSpicy: item.isSpicy,
                            spiceLevel: item.spiceLevel,
                            isBestseller: item.isBestseller,
                            isAvailable: item.isAvailable,
                            displayOrder: item.displayOrder,
                            isVisible: item.isVisible,
                            tags:
                                (item.tags as Prisma.InputJsonValue) ||
                                undefined,
                            nutritionInfo:
                                (item.nutritionInfo as Prisma.InputJsonValue) ||
                                undefined,
                            restaurantId: targetRestaurantId,
                            categoryId: duplicatedCategory.id,
                        },
                    });
                }
            }

            // Duplicate FAQs
            for (const faq of originalMenu.faqs) {
                await prisma.fAQ.create({
                    data: {
                        question: faq.question,
                        answer: faq.answer,
                        category: faq.category,
                        isActive: faq.isActive,
                        restaurantId: targetRestaurantId,
                        menuId: duplicatedMenu.id,
                    },
                });
            }

            return duplicatedMenu;
        });

        return NextResponse.json({
            success: true,
            message: 'Menu duplicated successfully',
            data: {
                id: result.id,
                name: result.name,
                restaurantId: result.restaurantId,
            },
        });
    } catch (error) {
        log.error('Menu duplication error', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
