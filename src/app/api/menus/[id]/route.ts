import { db } from '@/lib/db';
import { requireAuth } from '@/utils/auth-utils';
import { createServiceContext } from '@/utils/service-utils';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('MenuService');

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        log.info('Individual menu GET', { id });

        const menu = await db.menu.findUnique({
            where: { id },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                categories: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' },
                    include: {
                        menuItems: {
                            where: { isAvailable: true },
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
                { error: 'Menu not found' },
                { status: 404 }
            );
        }

        // Transform menu data
        const menuResponse = {
            id: menu.id,
            name: menu.name,
            description: menu.description,
            restaurantId: menu.restaurantId,
            isActive: menu.isActive,
            isPublished: menu.isPublished,
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
            restaurant: menu.restaurant,
            createdAt: menu.createdAt,
            updatedAt: menu.updatedAt,
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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) return error;

        const { id } = await params;
        const data = await request.json();

        const {
            name,
            description,
            isActive,
            isPublished,
            categories = [],
            faqs = [],
            theme,
        } = data;

        log.info('Updating menu', { id, categoryCount: categories.length });

        // Verify menu exists and check access
        const menu = await db.menu.findUnique({
            where: { id },
            include: { restaurant: true },
        });

        if (!menu) {
            return NextResponse.json(
                { error: 'Menu not found' },
                { status: 404 }
            );
        }

        // Check access for managers
        if (user.role === 'MANAGER') {
            if (!user.restaurantId || user.restaurantId !== menu.restaurantId) {
                return NextResponse.json(
                    { error: 'Access denied to this menu' },
                    { status: 403 }
                );
            }
        }

        const result = await db.$transaction(
            async (prisma) => {
                // Update menu
                const updatedMenu = await prisma.menu.update({
                    where: { id },
                    data: {
                        name: name || menu.name,
                        description,
                        isActive:
                            isActive !== undefined ? isActive : menu.isActive,
                        isPublished:
                            isPublished !== undefined
                                ? isPublished
                                : menu.isPublished,
                        theme,
                        version: menu.version + 1,
                        updatedAt: new Date(),
                    },
                });

                // Delete existing categories and related data using raw SQL for performance
                await prisma.$executeRaw`
                    DELETE FROM "public"."order_item_customizations" 
                    WHERE "orderItemId" IN (
                        SELECT oi.id FROM "public"."order_items" oi
                        INNER JOIN "public"."menu_items" mi ON oi."menuItemId" = mi.id
                        INNER JOIN "public"."menu_categories" mc ON mi."categoryId" = mc.id
                        WHERE mc."menuId" = ${id}
                    )
                `;

                await prisma.$executeRaw`
                    DELETE FROM "public"."order_items" 
                    WHERE "menuItemId" IN (
                        SELECT mi.id FROM "public"."menu_items" mi
                        INNER JOIN "public"."menu_categories" mc ON mi."categoryId" = mc.id
                        WHERE mc."menuId" = ${id}
                    )
                `;

                await prisma.$executeRaw`
                    DELETE FROM "public"."menu_analytics" 
                    WHERE "menuItemId" IN (
                        SELECT mi.id FROM "public"."menu_items" mi
                        INNER JOIN "public"."menu_categories" mc ON mi."categoryId" = mc.id
                        WHERE mc."menuId" = ${id}
                    )
                `;

                await prisma.$executeRaw`
                    DELETE FROM "public"."menu_item_customizations" 
                    WHERE "menuItemId" IN (
                        SELECT mi.id FROM "public"."menu_items" mi
                        INNER JOIN "public"."menu_categories" mc ON mi."categoryId" = mc.id
                        WHERE mc."menuId" = ${id}
                    )
                `;

                await prisma.$executeRaw`
                    DELETE FROM "public"."menu_item_allergens" 
                    WHERE "menuItemId" IN (
                        SELECT mi.id FROM "public"."menu_items" mi
                        INNER JOIN "public"."menu_categories" mc ON mi."categoryId" = mc.id
                        WHERE mc."menuId" = ${id}
                    )
                `;

                await prisma.$executeRaw`
                    DELETE FROM "public"."menu_item_ingredients" 
                    WHERE "menuItemId" IN (
                        SELECT mi.id FROM "public"."menu_items" mi
                        INNER JOIN "public"."menu_categories" mc ON mi."categoryId" = mc.id
                        WHERE mc."menuId" = ${id}
                    )
                `;

                // Delete menu items associated with this menu's categories
                await prisma.$executeRaw`
                    DELETE FROM "public"."menu_items" 
                    WHERE "categoryId" IN (
                        SELECT id FROM "public"."menu_categories" WHERE "menuId" = ${id}
                    )
                `;

                // Delete menu categories
                await prisma.$executeRaw`
                    DELETE FROM "public"."menu_categories" WHERE "menuId" = ${id}
                `;

                // Delete FAQs associated with this menu
                await prisma.$executeRaw`
                    DELETE FROM "public"."faqs" WHERE "menuId" = ${id}
                `;

                // Create new categories and items
                const createdCategories = [];
                const createdItems = [];
                const createdFaqs = [];

                for (let i = 0; i < categories.length; i++) {
                    const category = categories[i];
                    const categoryId = crypto.randomUUID();

                    await prisma.$executeRaw`
                        INSERT INTO "public"."menu_categories" 
                        (id, "menuId", name, description, "displayOrder", "isActive", "createdAt", "updatedAt", "isVisible")
                        VALUES (${categoryId}, ${id}, ${category.name}, ${
                        category.description || ''
                    }, 
                               ${category.displayOrder || 0}, ${
                        category.isActive !== false
                    }, NOW(), NOW(), true)
                    `;

                    createdCategories.push({
                        id: categoryId,
                        name: category.name,
                        description: category.description || '',
                        displayOrder: category.displayOrder || 0,
                        isActive: category.isActive !== false,
                    });

                    if (category.items && Array.isArray(category.items)) {
                        for (let j = 0; j < category.items.length; j++) {
                            const item = category.items[j];
                            const itemId = crypto.randomUUID();

                            await prisma.$executeRaw`
                                INSERT INTO "public"."menu_items" 
                                (id, "restaurantId", "categoryId", name, description, price, 
                                 "isVegetarian", "isVegan", "isGlutenFree", "isSpicy", "isAvailable", 
                                 "displayOrder", "createdAt", "updatedAt", "isVisible")
                                VALUES (${itemId}, ${
                                menu.restaurantId
                            }, ${categoryId}, ${item.name}, 
                                       ${item.description || ''}, ${
                                item.price || 0
                            }, 
                                       ${item.isVegetarian || false}, ${
                                item.isVegan || false
                            }, 
                                       ${item.isGlutenFree || false}, ${
                                item.isSpicy || false
                            }, 
                                       ${item.isAvailable !== false}, ${
                                item.displayOrder || 0
                            }, 
                                       NOW(), NOW(), true)
                            `;

                            createdItems.push({
                                id: itemId,
                                name: item.name,
                                description: item.description || '',
                                price: item.price || 0,
                                categoryId: categoryId,
                            });
                        }
                    }
                }

                // Handle FAQs
                if (faqs && Array.isArray(faqs)) {
                    for (let i = 0; i < faqs.length; i++) {
                        const faq = faqs[i];
                        if (faq.question && faq.answer) {
                            const faqId = crypto.randomUUID();

                            await prisma.$executeRaw`
                                INSERT INTO "public"."faqs" 
                                (id, "restaurantId", "menuId", question, answer, "isActive", "createdAt", "updatedAt")
                                VALUES (${faqId}, ${menu.restaurantId}, ${id}, ${faq.question}, ${faq.answer}, 
                                       true, NOW(), NOW())
                            `;

                            createdFaqs.push({
                                id: faqId,
                                question: faq.question,
                                answer: faq.answer,
                            });
                        }
                    }
                }

                return {
                    menu: updatedMenu,
                    categories: createdCategories,
                    items: createdItems,
                    faqs: createdFaqs,
                };
            },
            { timeout: 60000 }
        );

        return NextResponse.json({
            success: true,
            message: 'Menu updated successfully',
            data: {
                id: result.menu.id,
                name: result.menu.name,
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

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) return error;

        const { id } = await params;
        log.info('Deleting menu', { id });

        // Verify menu exists and check access
        const menu = await db.menu.findUnique({
            where: { id },
        });

        if (!menu) {
            return NextResponse.json(
                { error: 'Menu not found' },
                { status: 404 }
            );
        }

        // Check access for managers
        if (user.role === 'MANAGER') {
            if (!user.restaurantId || user.restaurantId !== menu.restaurantId) {
                return NextResponse.json(
                    { error: 'Access denied to this menu' },
                    { status: 403 }
                );
            }
        }

        await db.$transaction(
            async (prisma) => {
                // Delete all related data in correct order using raw SQL
                await prisma.$executeRaw`
                    DELETE FROM "public"."order_item_customizations" 
                    WHERE "orderItemId" IN (
                        SELECT oi.id FROM "public"."order_items" oi
                        INNER JOIN "public"."menu_items" mi ON oi."menuItemId" = mi.id
                        INNER JOIN "public"."menu_categories" mc ON mi."categoryId" = mc.id
                        WHERE mc."menuId" = ${id}
                    )
                `;

                await prisma.$executeRaw`
                    DELETE FROM "public"."order_items" 
                    WHERE "menuItemId" IN (
                        SELECT mi.id FROM "public"."menu_items" mi
                        INNER JOIN "public"."menu_categories" mc ON mi."categoryId" = mc.id
                        WHERE mc."menuId" = ${id}
                    )
                `;

                await prisma.$executeRaw`
                    DELETE FROM "public"."menu_analytics" 
                    WHERE "menuItemId" IN (
                        SELECT mi.id FROM "public"."menu_items" mi
                        INNER JOIN "public"."menu_categories" mc ON mi."categoryId" = mc.id
                        WHERE mc."menuId" = ${id}
                    )
                `;

                await prisma.$executeRaw`
                    DELETE FROM "public"."menu_item_customizations" 
                    WHERE "menuItemId" IN (
                        SELECT mi.id FROM "public"."menu_items" mi
                        INNER JOIN "public"."menu_categories" mc ON mi."categoryId" = mc.id
                        WHERE mc."menuId" = ${id}
                    )
                `;

                await prisma.$executeRaw`
                    DELETE FROM "public"."menu_item_allergens" 
                    WHERE "menuItemId" IN (
                        SELECT mi.id FROM "public"."menu_items" mi
                        INNER JOIN "public"."menu_categories" mc ON mi."categoryId" = mc.id
                        WHERE mc."menuId" = ${id}
                    )
                `;

                await prisma.$executeRaw`
                    DELETE FROM "public"."menu_item_ingredients" 
                    WHERE "menuItemId" IN (
                        SELECT mi.id FROM "public"."menu_items" mi
                        INNER JOIN "public"."menu_categories" mc ON mi."categoryId" = mc.id
                        WHERE mc."menuId" = ${id}
                    )
                `;

                await prisma.$executeRaw`
                    DELETE FROM "public"."menu_items" 
                    WHERE "categoryId" IN (
                        SELECT id FROM "public"."menu_categories" WHERE "menuId" = ${id}
                    )
                `;

                await prisma.$executeRaw`
                    DELETE FROM "public"."menu_categories" WHERE "menuId" = ${id}
                `;

                await prisma.$executeRaw`
                    DELETE FROM "public"."faqs" WHERE "menuId" = ${id}
                `;

                // Finally delete the menu
                await prisma.menu.delete({
                    where: { id },
                });
            },
            { timeout: 60000 }
        );

        return NextResponse.json({
            success: true,
            message: 'Menu deleted successfully',
            data: { id },
        });
    } catch (error) {
        log.error('Menu deletion error', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
