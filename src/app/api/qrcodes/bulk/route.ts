import { db } from '@/lib/db';
import { requireAuth } from '@/utils/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/qrcodes/bulk { menuId, totalTables } or { restaurantId, totalTables } (legacy)
export async function POST(req: NextRequest) {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) return error;

        const body = await req.json();
        const menuId = body?.menuId as string | undefined;
        const restaurantId = body?.restaurantId as string | undefined; // Legacy support
        const totalTables = Number(body?.totalTables);
        const startNumber = Number(body?.startNumber) || 1;

        if (!menuId && !restaurantId) {
            return NextResponse.json(
                { error: 'menuId or restaurantId is required' },
                { status: 400 }
            );
        }
        if (
            !Number.isFinite(totalTables) ||
            totalTables < 1 ||
            totalTables > 500
        ) {
            return NextResponse.json(
                { error: 'totalTables must be between 1 and 500' },
                { status: 400 }
            );
        }

        let finalMenuId = menuId;
        let finalRestaurantId = restaurantId;

        // Handle menuId case
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

        // Handle legacy restaurantId case
        if (restaurantId && !menuId) {
            if (user.role === 'MANAGER' && user.restaurantId !== restaurantId) {
                return NextResponse.json(
                    { error: 'Access denied to this restaurant' },
                    { status: 403 }
                );
            }

            // Get default menu for the restaurant
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

        // Ensure we have a restaurantId (required field)
        if (!finalRestaurantId) {
            return NextResponse.json(
                { error: 'Could not determine restaurant' },
                { status: 400 }
            );
        }

        // Get existing QR codes to avoid duplicates
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: any = { restaurantId: finalRestaurantId };
        if (finalMenuId) {
            whereClause.menuId = finalMenuId;
        }

        const existing = await db.qRCode.findMany({
            where: whereClause,
            select: { tableNumber: true },
        });

        const existingSet = new Set(existing.map((e) => e.tableNumber || ''));

        // Prepare QR codes to create
        const toCreate: Array<{
            restaurantId: string;
            menuId?: string;
            tableNumber: string;
            qrToken: string;
            isActive: boolean;
            scanCount: number;
        }> = [];

        for (let i = 0; i < totalTables; i++) {
            const tableNum = String(startNumber + i);
            if (!existingSet.has(tableNum)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const qrData: any = {
                    restaurantId: finalRestaurantId,
                    tableNumber: tableNum,
                    qrToken: crypto.randomUUID(),
                    isActive: true,
                    scanCount: 0,
                };

                // Only add menuId if we have one (to avoid undefined issues)
                if (finalMenuId) {
                    qrData.menuId = finalMenuId;
                }

                toCreate.push(qrData);
            }
        }

        let createdCount = 0;
        if (toCreate.length > 0) {
            try {
                await db.$transaction(async (prisma) => {
                    // Create in smaller batches to avoid timeout
                    const batchSize = 50;
                    for (let i = 0; i < toCreate.length; i += batchSize) {
                        const batch = toCreate.slice(i, i + batchSize);
                        await prisma.qRCode.createMany({
                            data: batch,
                            skipDuplicates: true,
                        });
                    }
                });

                createdCount = toCreate.length;
            } catch (createError) {
                console.error('Error creating QR codes in bulk:', createError);
                return NextResponse.json(
                    {
                        error: 'Failed to create QR codes',
                        details:
                            createError instanceof Error
                                ? createError.message
                                : 'Unknown error',
                    },
                    { status: 500 }
                );
            }
        }

        // Get summary of all QR codes after creation
        const allQRCodes = await db.qRCode.findMany({
            where: whereClause,
            select: {
                id: true,
                tableNumber: true,
                isActive: true,
                scanCount: true,
                createdAt: true,
            },
            orderBy: [{ tableNumber: 'asc' }, { createdAt: 'desc' }],
        });

        return NextResponse.json({
            success: true,
            created: createdCount,
            totalTables,
            existingCount: existing.length,
            finalCount: allQRCodes.length,
            skipped: totalTables - createdCount, // How many were already existing
            summary: {
                activeQRCodes: allQRCodes.filter((qr) => qr.isActive).length,
                totalScans: allQRCodes.reduce(
                    (sum, qr) => sum + qr.scanCount,
                    0
                ),
            },
        });
    } catch (error) {
        console.error('Bulk QR codes POST error', error);
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
