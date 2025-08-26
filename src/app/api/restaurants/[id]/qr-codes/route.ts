import { db } from '@/lib/db';
import { requireRestaurantAccess } from '@/utils/auth-utils';
import { createServiceContext } from '@/utils/service-utils';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const { log } = createServiceContext('QRCodeService');

interface RouteParams {
    params: Promise<{
        restaurantId: string;
    }>;
}

// GET /api/restaurants/[restaurantId]/qr-codes - Get all QR codes for a restaurant
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { restaurantId } = await params;
        const { error, user } = await requireRestaurantAccess(restaurantId);

        if (error) return error;

        log.info('Fetching QR codes', { restaurantId, userId: user?.id });

        const qrCodes = await db.qRCode.findMany({
            where: { restaurantId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(qrCodes);
    } catch (error) {
        log.error('Error fetching QR codes', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/restaurants/[restaurantId]/qr-codes - Create a new QR code
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { restaurantId } = await params;
        const { error, user } = await requireRestaurantAccess(restaurantId);

        if (error) return error;

        const body = await request.json();
        const { tableNumber } = body;

        log.info('Creating QR code', {
            restaurantId,
            tableNumber,
            userId: user?.id,
        });

        const qrToken = uuidv4();
        const qrCode = await db.qRCode.create({
            data: {
                restaurantId,
                tableNumber,
                qrToken,
                qrImageUrl: `/api/qr/generate?token=${qrToken}`, // You'll need to implement QR generation
            },
        });

        return NextResponse.json(qrCode);
    } catch (error) {
        log.error('Error creating QR code', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// app/api/restaurants/[restaurantId]/qr-codes/[qrId]/route.ts
interface QRRouteParams {
    params: Promise<{
        restaurantId: string;
        qrId: string;
    }>;
}

// DELETE /api/restaurants/[restaurantId]/qr-codes/[qrId] - Delete a QR code
export async function DELETE(request: NextRequest, { params }: QRRouteParams) {
    try {
        const { restaurantId, qrId } = await params;
        const { error, user } = await requireRestaurantAccess(restaurantId);

        if (error) return error;

        // Verify QR code belongs to this restaurant
        const qrCode = await db.qRCode.findFirst({
            where: {
                id: qrId,
                restaurantId,
            },
        });

        if (!qrCode) {
            return NextResponse.json(
                { error: 'QR code not found' },
                { status: 404 }
            );
        }

        log.info('Deleting QR code', { restaurantId, qrId, userId: user?.id });

        await db.qRCode.delete({
            where: { id: qrId },
        });

        return NextResponse.json({ message: 'QR code deleted successfully' });
    } catch (error) {
        log.error('Error deleting QR code', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
