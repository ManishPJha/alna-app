/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/lib/db';
import { requireAuth } from '@/utils/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/qrcodes?menuId=... or restaurantId=...
export async function GET(req: NextRequest) {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) return error;

        const { searchParams } = new URL(req.url);
        const menuId = searchParams.get('menuId');
        const restaurantId = searchParams.get('restaurantId');

        if (!menuId && !restaurantId) {
            return NextResponse.json(
                { error: 'menuId or restaurantId is required' },
                { status: 400 }
            );
        }

        let whereClause: any = {};
        const includeClause: any = {
            restaurant: {
                select: {
                    id: true,
                    name: true,
                },
            },
        };

        // Handle menu-based query (preferred)
        if (menuId) {
            const menu = await db.menu.findUnique({
                where: { id: menuId },
                include: { restaurant: true },
            });

            if (!menu) {
                return NextResponse.json(
                    { error: 'Menu not found' },
                    { status: 404 }
                );
            }

            if (
                user.role === 'MANAGER' &&
                user.restaurantId !== menu.restaurantId
            ) {
                return NextResponse.json(
                    { error: 'Access denied to this menu' },
                    { status: 403 }
                );
            }

            whereClause = {
                OR: [
                    { menuId: menuId },
                    // Also include QR codes without menuId but same restaurant (legacy)
                    { restaurantId: menu.restaurantId, menuId: null },
                ],
            };

            includeClause.menu = {
                select: {
                    id: true,
                    name: true,
                    restaurant: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            };
        }
        // Handle restaurant-based query (legacy)
        else if (restaurantId) {
            if (user.role === 'MANAGER' && user.restaurantId !== restaurantId) {
                return NextResponse.json(
                    { error: 'Access denied to this restaurant' },
                    { status: 403 }
                );
            }

            whereClause = { restaurantId };
        }

        const qrCodes = await db.qRCode.findMany({
            where: whereClause,
            include: includeClause,
            orderBy: [{ tableNumber: 'asc' }, { createdAt: 'desc' }],
            take: 200,
        });

        return NextResponse.json({
            success: true,
            qrCodes: qrCodes.map((qr) => ({
                ...qr,
                // Ensure consistent date formatting
                createdAt: qr.createdAt.toISOString(),
                updatedAt: qr.updatedAt.toISOString(),
                lastScanned: qr.lastScanned?.toISOString() || null,
            })),
        });
    } catch (error) {
        console.error('QR codes GET error', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// POST /api/qrcodes { menuId, tableNumber } or { restaurantId, tableNumber }
export async function POST(req: NextRequest) {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) return error;

        const body = await req.json();
        const menuId = body?.menuId as string | undefined;
        const restaurantId = body?.restaurantId as string | undefined;
        const tableNumber = body?.tableNumber as string | undefined;

        if (!menuId && !restaurantId) {
            return NextResponse.json(
                { error: 'menuId or restaurantId is required' },
                { status: 400 }
            );
        }
        if (!tableNumber?.trim()) {
            return NextResponse.json(
                { error: 'tableNumber is required' },
                { status: 400 }
            );
        }

        let finalMenuId = menuId;
        let finalRestaurantId = restaurantId;

        // Handle menu-based creation (preferred)
        if (menuId) {
            const menu = await db.menu.findUnique({
                where: { id: menuId },
                select: { id: true, restaurantId: true },
            });

            if (!menu) {
                return NextResponse.json(
                    { error: 'Menu not found' },
                    { status: 404 }
                );
            }

            if (
                user.role === 'MANAGER' &&
                user.restaurantId !== menu.restaurantId
            ) {
                return NextResponse.json(
                    { error: 'Access denied to this menu' },
                    { status: 403 }
                );
            }

            finalRestaurantId = menu.restaurantId;
        }
        // Handle legacy restaurant-based creation
        else if (restaurantId) {
            if (user.role === 'MANAGER' && user.restaurantId !== restaurantId) {
                return NextResponse.json(
                    { error: 'Access denied to this restaurant' },
                    { status: 403 }
                );
            }

            // Try to get default menu
            const defaultMenu = await db.menu.findFirst({
                where: {
                    restaurantId,
                    isActive: true,
                },
                select: { id: true },
                orderBy: { createdAt: 'asc' },
            });

            if (defaultMenu) {
                finalMenuId = defaultMenu.id;
            }
            finalRestaurantId = restaurantId;
        }

        if (!finalRestaurantId) {
            return NextResponse.json(
                { error: 'Could not determine restaurant' },
                { status: 400 }
            );
        }

        // Check for existing QR code with same table number
        const existingWhere: any = {
            restaurantId: finalRestaurantId,
            tableNumber: tableNumber.trim(),
        };

        if (finalMenuId) {
            existingWhere.menuId = finalMenuId;
        }

        const existingQR = await db.qRCode.findFirst({
            where: existingWhere,
        });

        if (existingQR) {
            return NextResponse.json(
                { error: `QR code for table ${tableNumber} already exists` },
                { status: 409 }
            );
        }

        // Create new QR code
        const createData: any = {
            restaurantId: finalRestaurantId,
            tableNumber: tableNumber.trim(),
            qrToken: crypto.randomUUID(),
            isActive: true,
            scanCount: 0,
        };

        if (finalMenuId) {
            createData.menuId = finalMenuId;
        }

        const created = await db.qRCode.create({
            data: createData,
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                menu: finalMenuId
                    ? {
                          select: {
                              id: true,
                              name: true,
                              restaurant: {
                                  select: {
                                      id: true,
                                      name: true,
                                  },
                              },
                          },
                      }
                    : undefined,
            },
        });

        return NextResponse.json(
            {
                success: true,
                qrCode: {
                    ...created,
                    createdAt: created.createdAt.toISOString(),
                    updatedAt: created.updatedAt.toISOString(),
                    lastScanned: created.lastScanned?.toISOString() || null,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('QR code POST error', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
