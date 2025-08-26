import { db } from '@/lib/db';
import { requireRestaurantAccess } from '@/utils/auth-utils';
import { createServiceContext } from '@/utils/service-utils';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('AnalyticsService');

interface RouteParams {
    params: Promise<{ restaurantId: string }>;
}

// GET /api/restaurants/[restaurantId]/analytics - Get analytics for a restaurant
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { restaurantId } = await params;
        const { error, user } = await requireRestaurantAccess(restaurantId);

        if (error) return error;

        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const eventType = searchParams.get('eventType');

        log.info('Fetching analytics', { restaurantId, userId: user?.id });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = { restaurantId };

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        if (eventType) {
            where.eventType = eventType;
        }

        // Get various analytics metrics
        const [
            totalViews,
            totalOrders,
            popularItems,
            languageUsage,
            qrScans,
            customerQuestions,
        ] = await Promise.all([
            // Total menu views
            db.menuAnalytics.count({
                where: { ...where, eventType: 'VIEW' },
            }),

            // Total orders
            db.order.count({
                where: {
                    restaurantId,
                    createdAt: where.createdAt,
                },
            }),

            // Most popular items (top 10)
            db.menuAnalytics.groupBy({
                by: ['menuItemId'],
                where: {
                    ...where,
                    eventType: 'ADD_TO_ORDER',
                    menuItemId: { not: null },
                },
                _count: true,
                orderBy: {
                    _count: {
                        menuItemId: 'desc',
                    },
                },
                take: 10,
            }),

            // Language usage statistics
            db.languageUsage.findMany({
                where: { restaurantId },
                orderBy: { usageCount: 'desc' },
            }),

            // QR code scan statistics
            db.qRCode.findMany({
                where: { restaurantId },
                select: {
                    id: true,
                    tableNumber: true,
                    scanCount: true,
                    lastScanned: true,
                },
                orderBy: { scanCount: 'desc' },
            }),

            // Customer questions analytics
            db.customerQuestion.groupBy({
                by: ['isAnswered'],
                where: { restaurantId },
                _count: true,
            }),
        ]);

        // Fetch menu item details for popular items
        const popularItemIds = popularItems
            .map((item) => item.menuItemId)
            .filter(Boolean);
        const menuItems = await db.menuItem.findMany({
            where: { id: { in: popularItemIds as string[] } },
            select: { id: true, name: true, price: true },
        });

        const itemMap = new Map(menuItems.map((item) => [item.id, item]));
        const popularItemsWithDetails = popularItems.map((item) => ({
            ...itemMap.get(item.menuItemId!),
            orderCount: item._count,
        }));

        return NextResponse.json({
            metrics: {
                totalViews,
                totalOrders,
                qrScans: qrScans.reduce((sum, qr) => sum + qr.scanCount, 0),
                answeredQuestions:
                    customerQuestions.find((q) => q.isAnswered)?._count || 0,
                unansweredQuestions:
                    customerQuestions.find((q) => !q.isAnswered)?._count || 0,
            },
            popularItems: popularItemsWithDetails,
            languageUsage,
            qrCodeStats: qrScans,
        });
    } catch (error) {
        log.error('Error fetching analytics', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/restaurants/[restaurantId]/analytics - Track an analytics event
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { restaurantId } = await params;

        // Analytics tracking doesn't require authentication (public endpoint for customers)
        const body = await request.json();
        const {
            eventType,
            menuItemId,
            qrCodeId,
            languageCode,
            sessionId,
            metadata,
        } = body;

        if (!eventType) {
            return NextResponse.json(
                { error: 'Event type is required' },
                { status: 400 }
            );
        }

        log.info('Tracking analytics event', { restaurantId, eventType });

        const analytics = await db.menuAnalytics.create({
            data: {
                restaurantId,
                eventType,
                menuItemId,
                qrCodeId,
                languageCode,
                sessionId,
                metadata,
            },
        });

        // Update language usage if language code provided
        if (languageCode) {
            await db.languageUsage.upsert({
                where: {
                    restaurantId_languageCode: {
                        restaurantId,
                        languageCode,
                    },
                },
                update: {
                    usageCount: { increment: 1 },
                    lastUsed: new Date(),
                },
                create: {
                    restaurantId,
                    languageCode,
                    usageCount: 1,
                },
            });
        }

        // Update QR code scan count if QR code ID provided
        if (qrCodeId) {
            await db.qRCode.update({
                where: { id: qrCodeId },
                data: {
                    scanCount: { increment: 1 },
                    lastScanned: new Date(),
                },
            });
        }

        return NextResponse.json(analytics);
    } catch (error) {
        log.error('Error tracking analytics', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
