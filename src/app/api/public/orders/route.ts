import { db } from '@/lib/db';
import { createServiceContext } from '@/utils/service-utils';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('PublicOrderService');

// Expected payload
// {
//   restaurantId: string,
//   menuId?: string, // ADDED: Optional specific menu ID
//   tableNumber?: string,
//   qrCodeId?: string,
//   qrToken?: string,
//   customerLanguage?: string,
//   originalLanguage?: string,
//   specialRequests?: string,
//   items: Array<{ menuItemId: string; quantity: number; unitPrice?: number; specialInstructions?: string; customizationOptionIds?: string[] }>
// }

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            restaurantId,
            menuId, // ADDED: Handle menu ID from payload
            tableNumber,
            qrCodeId: qrCodeIdRaw,
            qrToken,
            customerLanguage = 'en',
            originalLanguage = 'en',
            specialRequests,
            items,
        } = body ?? {};

        // Basic validation
        if (
            !restaurantId ||
            !items ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return NextResponse.json(
                { error: 'Missing required fields: restaurantId and items' },
                { status: 400 }
            );
        }

        // Verify restaurant exists and is active
        const restaurant = await db.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                menus: {
                    where: {
                        isActive: true,
                        isPublished: true,
                        ...(menuId && { id: menuId }), // If specific menuId provided, filter for it
                    },
                    orderBy: { updatedAt: 'desc' },
                    take: 1,
                    select: { id: true, name: true },
                },
            },
        });

        if (!restaurant) {
            return NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404 }
            );
        }

        // Determine which menu to use
        const targetMenu = restaurant.menus[0];
        if (!targetMenu) {
            return NextResponse.json(
                { error: 'No published menu available for this restaurant' },
                { status: 400 }
            );
        }

        // Resolve QR code by provided qrCodeId, qrToken, or tableNumber
        let qrCodeId: string | null = null;
        let customerSessionId: string | null = null;

        if (qrToken) {
            const qr = await db.qRCode.findUnique({
                where: { qrToken },
                include: {
                    customerSessions: {
                        where: { isActive: true },
                        orderBy: { startedAt: 'desc' },
                        take: 1,
                    },
                },
            });

            if (!qr || !qr.isActive || qr.restaurantId !== restaurantId) {
                return NextResponse.json(
                    { error: 'Invalid QR token' },
                    { status: 400 }
                );
            }

            qrCodeId = qr.id;

            // Create or get customer session
            let session = qr.customerSessions[0];
            if (!session) {
                session = await db.customerSession.create({
                    data: {
                        restaurantId,
                        qrCodeId: qr.id,
                        sessionToken: randomUUID(),
                        preferredLanguage: customerLanguage,
                        customerIp:
                            req.headers.get('x-forwarded-for') || 'unknown',
                        userAgent: req.headers.get('user-agent') || 'unknown',
                    },
                });
            }
            customerSessionId = session.id;
        } else if (qrCodeIdRaw) {
            const qr = await db.qRCode.findUnique({
                where: { id: qrCodeIdRaw },
            });
            if (!qr || !qr.isActive || qr.restaurantId !== restaurantId) {
                return NextResponse.json(
                    { error: 'Invalid QR code' },
                    { status: 400 }
                );
            }
            qrCodeId = qr.id;
        } else if (tableNumber) {
            let qr = await db.qRCode.findFirst({
                where: { restaurantId, tableNumber, isActive: true },
            });

            if (!qr) {
                // Auto-create QRCode for this table if not present
                qr = await db.qRCode.create({
                    data: {
                        restaurantId,
                        tableNumber,
                        qrToken: randomUUID(),
                        isActive: true,
                    },
                });
            }
            qrCodeId = qr.id;
        }

        // Validate items exist and belong to the correct menu/restaurant
        const menuItemIds = items.map(
            (i: { menuItemId: string }) => i.menuItemId
        );

        // UPDATED: Validate menu items belong to the target menu through categories
        const menuItems = await db.menuItem.findMany({
            where: {
                id: { in: menuItemIds },
                restaurantId,
                isAvailable: true,
                category: {
                    menuId: targetMenu.id, // ADDED: Ensure items belong to the correct menu
                    isActive: true,
                },
            },
            select: {
                id: true,
                price: true,
                name: true,
                category: {
                    select: {
                        menuId: true,
                        menu: {
                            select: { name: true },
                        },
                    },
                },
            },
        });

        const menuById = new Map(menuItems.map((m) => [m.id, m]));

        // Validate all requested items exist
        for (const item of items) {
            if (!menuById.has(item.menuItemId)) {
                return NextResponse.json(
                    {
                        error: `Menu item not found or unavailable: ${item.menuItemId}`,
                    },
                    { status: 400 }
                );
            }
        }

        let totalAmount = 0;
        const preparedItems = items.map(
            (i: {
                menuItemId: string;
                unitPrice?: number;
                quantity?: number;
                specialInstructions?: string;
                customizationOptionIds?: string[];
            }) => {
                const mi = menuById.get(i.menuItemId)!; // We know it exists from validation above
                const unitPrice =
                    typeof i.unitPrice === 'number' && i.unitPrice > 0
                        ? i.unitPrice
                        : parseFloat(mi.price.toString());
                const quantity = Math.max(1, Number(i.quantity || 1));
                const totalPrice = unitPrice * quantity;
                totalAmount += totalPrice;
                return { ...i, unitPrice, quantity, totalPrice };
            }
        );

        // Create the order and items transactionally
        const order = await db.$transaction(async (tx) => {
            const createdOrder = await tx.order.create({
                data: {
                    restaurantId,
                    sessionId: customerSessionId, // ADDED: Link to customer session
                    qrCodeId: qrCodeId ?? undefined,
                    customerLanguage,
                    originalLanguage,
                    specialRequests,
                    status: 'RECEIVED',
                    submittedAt: new Date(),
                    totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)),
                },
            });

            for (const pi of preparedItems) {
                const createdItem = await tx.orderItem.create({
                    data: {
                        orderId: createdOrder.id,
                        menuItemId: pi.menuItemId,
                        quantity: pi.quantity,
                        unitPrice: new Prisma.Decimal(pi.unitPrice.toFixed(2)),
                        totalPrice: new Prisma.Decimal(
                            pi.totalPrice.toFixed(2)
                        ),
                        specialInstructions: pi.specialInstructions,
                    },
                });

                // Handle customizations if provided
                if (
                    Array.isArray(pi.customizationOptionIds) &&
                    pi.customizationOptionIds.length > 0
                ) {
                    // Validate customization options exist and belong to the restaurant
                    const validOptions = await tx.customizationOption.findMany({
                        where: {
                            id: { in: pi.customizationOptionIds },
                            group: { restaurantId },
                        },
                        select: {
                            id: true,
                            priceModifier: true,
                        },
                    });

                    if (
                        validOptions.length !== pi.customizationOptionIds.length
                    ) {
                        throw new Error(
                            `Invalid customization options provided for item ${pi.menuItemId}`
                        );
                    }

                    await tx.orderItemCustomization.createMany({
                        data: validOptions.map((option) => ({
                            orderItemId: createdItem.id,
                            customizationOptionId: option.id,
                            priceModifier: option.priceModifier, // Use actual price modifier
                        })),
                    });
                }
            }

            // Update QR code scan count if applicable
            if (qrCodeId) {
                await tx.qRCode.update({
                    where: { id: qrCodeId },
                    data: {
                        scanCount: { increment: 1 },
                        lastScanned: new Date(),
                    },
                });
            }

            // Update customer session activity if applicable
            if (customerSessionId) {
                await tx.customerSession.update({
                    where: { id: customerSessionId },
                    data: { lastActivity: new Date() },
                });
            }

            return createdOrder;
        });

        log.info('Order submitted successfully', {
            orderId: order.id,
            restaurantId,
            menuId: targetMenu.id,
            totalAmount: totalAmount.toFixed(2),
            itemCount: items.length,
        });

        return NextResponse.json({
            success: true,
            orderId: order.id,
            menuName: targetMenu.name,
            totalAmount: totalAmount.toFixed(2),
            estimatedTime: '15-20 minutes', // Could be dynamic based on restaurant settings
        });
    } catch (error) {
        log.error('Public order POST error', error);

        if (error instanceof Error) {
            return NextResponse.json(
                {
                    error: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
