import { db } from '@/lib/db';
import { requireRestaurantAccess } from '@/utils/auth-utils';
import { createServiceContext } from '@/utils/service-utils';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('OrderService');

interface RouteParams {
    params: Promise<{
        restaurantId: string;
    }>;
}

// GET /api/restaurants/[restaurantId]/orders - Get orders for a restaurant
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { restaurantId } = await params;
        const { error, user } = await requireRestaurantAccess(restaurantId);

        if (error) return error;

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const page = Number(searchParams.get('page')) || 1;
        const limit = Number(searchParams.get('limit')) || 20;
        const date = searchParams.get('date'); // Format: YYYY-MM-DD

        log.info('Fetching orders', { restaurantId, status, userId: user?.id });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = { restaurantId };

        if (status) {
            where.status = status;
        }

        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);

            where.createdAt = {
                gte: startDate,
                lt: endDate,
            };
        }

        const [orders, total] = await Promise.all([
            db.order.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    orderItems: {
                        include: {
                            menuItem: true,
                            customizations: {
                                include: {
                                    customizationOption: true,
                                },
                            },
                        },
                    },
                    qrCode: true,
                },
            }),
            db.order.count({ where }),
        ]);

        return NextResponse.json({
            orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasMore: page < Math.ceil(total / limit),
            },
        });
    } catch (error) {
        log.error('Error fetching orders', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// app/api/restaurants/[restaurantId]/orders/[orderId]/route.ts
interface OrderRouteParams {
    params: Promise<{
        restaurantId: string;
        orderId: string;
    }>;
}

// PATCH /api/restaurants/[restaurantId]/orders/[orderId] - Update order status
export async function PATCH(
    request: NextRequest,
    { params }: OrderRouteParams
) {
    try {
        const { restaurantId, orderId } = await params;
        const { error, user } = await requireRestaurantAccess(restaurantId);

        if (error) return error;

        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json(
                { error: 'Status is required' },
                { status: 400 }
            );
        }

        // Verify order belongs to this restaurant
        const order = await db.order.findFirst({
            where: {
                id: orderId,
                restaurantId,
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        log.info('Updating order status', {
            orderId,
            status,
            userId: user?.id,
        });

        const updatedOrder = await db.order.update({
            where: { id: orderId },
            data: { status },
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        log.error('Error updating order', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
