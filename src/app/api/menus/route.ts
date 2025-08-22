/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from '@/features/auth';
import { db } from '@/lib/db';
import { createServiceContext } from '@/utils/service-utils';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('MenuService');

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;

        const page = Number(searchParams.get('page')) || 1;
        const limit = Number(searchParams.get('limit')) || 10;

        log.info('menu GET', { page, limit });

        const menus = await db.menuItem.findMany({
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                category: {
                    include: {
                        restaurant: true,
                    },
                },
            },
        });

        const totalMenus = await db.menuItem.count();

        const pagination = {
            total: totalMenus,
            page,
            limit,
            totalPages: Math.ceil(totalMenus / limit),
            hasMore: page < Math.ceil(totalMenus / limit),
        };

        return NextResponse.json({ menus, pagination });
    } catch (error) {
        log.error('menu GET error', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// {
//   "name": "Spice Route Houston",
//   "description": "Spice Route Houston Foods - Gives you a real taste of Spanish traditional foods. ",
//   "restaurantId": "1095c3ce-2620-4249-91d0-275f53f7fe27",
//   "isActive": true,
//   "categories": [
//     {
//       "id": "temp-cat-1755863258816",
//       "name": "Chinese",
//       "description": "chinese food items",
//       "displayOrder": 1,
//       "isActive": true,
//       "items": [
//         {
//           "id": "temp-item-1755863290176",
//           "name": "Noodles",
//           "description": "Hot spicy noodles",
//           "price": 90,
//           "isVegetarian": true,
//           "isVegan": false,
//           "isGlutenFree": false,
//           "isSpicy": true,
//           "isAvailable": true,
//           "displayOrder": 1,
//           "categoryId": "temp-cat-1755863258816"
//         },
//         {
//           "id": "temp-item-1755863336527",
//           "name": "Singapoori Rice",
//           "description": "The best seller in spices.",
//           "price": 120,
//           "isVegetarian": false,
//           "isVegan": true,
//           "isGlutenFree": false,
//           "isSpicy": true,
//           "isAvailable": true,
//           "displayOrder": 1,
//           "categoryId": "temp-cat-1755863258816"
//         }
//       ]
//     }
//   ],
//   "theme": {
//     "primaryColor": "#191eb8",
//     "backgroundColor": "#f9fafb",
//     "accentColor": "#6734df",
//     "fontFamily": "Inter"
//   }
// }

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const data = await request.json();

        const { name, description, restaurantId, isActive, categories, theme } =
            data;

        if (!name || !restaurantId) {
            return NextResponse.json(
                { error: 'name and restaurantId are required' },
                { status: 400 }
            );
        }

        log.info('menu POST', { name, restaurantId });

        const categoriesArray = Array.isArray(categories) ? categories : [];

        // create categories and items in a nested create
        // but for simplicity, we will just create a menu item here
        // and handle categories and items separately

        const result = await db.$transaction(async (prisma) => {
            // create categories first
            const createdCategories = await Promise.all(
                categoriesArray.map((category: any) =>
                    prisma.menuCategory.create({
                        data: {
                            name: category.name,
                            description: category.description,
                            displayOrder: category.displayOrder,
                            isActive: category.isActive,
                            restaurantId,
                        },
                    })
                )
            );

            // then create items for each category
            for (let i = 0; i < categoriesArray.length; i++) {
                const category = categoriesArray[i];
                const createdCategory = createdCategories[i];

                if (category.items && Array.isArray(category.items)) {
                    await Promise.all(
                        category.items.map((item: any) =>
                            prisma.menuItem.create({
                                data: {
                                    name: item.name,
                                    description: item.description,
                                    price: item.price || 0,
                                    isVegetarian: item.isVegetarian || false,
                                    isVegan: item.isVegan || false,
                                    isGlutenFree: item.isGlutenFree || false,
                                    isSpicy: item.isSpicy || false,
                                    isAvailable: item.isAvailable || true,
                                    spiceLevel: item.spicyLevel || 0,
                                    isBestseller: item.isBestseller || false,
                                    displayOrder: item.displayOrder || 0,
                                    restaurantId,
                                    categoryId: createdCategory.id,
                                },
                            })
                        )
                    );
                }
            }
        });

        // const newMenu = await db.menuItem.create({
        //     data: {
        //         name,
        //         description,
        //         restaurantId,
        //         price: 0,
        //         categoryId: '',

        //         // category: {
        //         //     create: categories.map((category: any) => ({
        //         //         name: category.name,
        //         //         description: category.description,
        //         //         displayOrder: category.displayOrder,
        //         //         isActive: category.isActive,
        //         //         items: {
        //         //             create: category.items.map((item: any) => ({
        //         //                 name: item.name,
        //         //                 description: item.description,
        //         //                 price: item.price,
        //         //                 isVegetarian: item.isVegetarian,
        //         //                 isVegan: item.isVegan,
        //         //                 isGlutenFree: item.isGlutenFree,
        //         //                 isSpicy: item.isSpicy,
        //         //                 isAvailable: item.isAvailable,
        //         //                 displayOrder: item.displayOrder,
        //         //             })),
        //         //         },
        //         //     })),
        //         // },
        //         // ...data,
        //     },
        // });

        return NextResponse.json(
            {
                message: 'Menu created successfully',
                menu: result,
            },
            { status: 201 }
        );
    } catch (error) {
        log.error('menu POST error', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
