import { db } from '@/lib/db';
import { createServiceContext } from '@/utils/service-utils';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('OrderService');

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { items, total, specialRequests, tableNumber } = body;

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: 'No items in order' },
                { status: 400 }
            );
        }

        log.info('Creating order', { itemCount: items.length, total });

        // Create the order in the database
        const order = await db.order.create({
            data: {
                restaurantId: items[0].restaurantId || 'default-restaurant-id', // You'll need to pass this
                customerLanguage: 'en',
                originalLanguage: 'en',
                totalAmount: total,
                specialRequests,
                status: 'SUBMITTED',
                submittedAt: new Date(),
                orderItems: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    create: items.map((item: any) => ({
                        menuItemId: item.id,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        totalPrice: item.price * item.quantity,
                    })),
                },
            },
        });

        // Track analytics
        await db.menuAnalytics.create({
            data: {
                restaurantId: order.restaurantId,
                eventType: 'ADD_TO_ORDER',
                languageCode: 'en',
                metadata: { orderId: order.id, tableNumber },
            },
        });

        return NextResponse.json({
            orderId: order.id,
            message: 'Order placed successfully',
        });
    } catch (error) {
        log.error('Order creation error', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const orderId = searchParams.get('id');

        if (orderId) {
            const order = await db.order.findUnique({
                where: { id: orderId },
                include: {
                    orderItems: {
                        include: {
                            menuItem: true,
                        },
                    },
                },
            });

            if (!order) {
                return NextResponse.json(
                    { error: 'Order not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json(order);
        }

        // Return list of orders (you might want to add pagination)
        const orders = await db.order.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        return NextResponse.json(orders);
    } catch (error) {
        log.error('Order fetch error', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
