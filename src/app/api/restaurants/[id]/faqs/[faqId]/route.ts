import { db } from '@/lib/db';
import { requireRestaurantAccess } from '@/utils/auth-utils';
import { createServiceContext } from '@/utils/service-utils';
import { NextRequest, NextResponse } from 'next/server';

interface FAQRouteParams {
    params: Promise<{
        restaurantId: string;
        faqId: string;
    }>;
}

const { log } = createServiceContext('FAQService');

// PUT /api/restaurants/[restaurantId]/faqs/[faqId] - Update FAQ
export async function PUT(request: NextRequest, { params }: FAQRouteParams) {
    try {
        const { restaurantId, faqId } = await params;
        const { error, user } = await requireRestaurantAccess(restaurantId);

        if (error) return error;

        const body = await request.json();

        // Verify FAQ belongs to this restaurant
        const existingFaq = await db.fAQ.findFirst({
            where: {
                id: faqId,
                restaurantId,
            },
        });

        if (!existingFaq) {
            return NextResponse.json(
                { error: 'FAQ not found' },
                { status: 404 }
            );
        }

        log.info('Updating FAQ', { faqId, userId: user?.id });

        const updatedFaq = await db.fAQ.update({
            where: { id: faqId },
            data: body,
        });

        return NextResponse.json(updatedFaq);
    } catch (error) {
        log.error('Error updating FAQ', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/restaurants/[restaurantId]/faqs/[faqId] - Delete FAQ
export async function DELETE(request: NextRequest, { params }: FAQRouteParams) {
    try {
        const { restaurantId, faqId } = await params;
        const { error, user } = await requireRestaurantAccess(restaurantId);

        if (error) return error;

        // Verify FAQ belongs to this restaurant
        const existingFaq = await db.fAQ.findFirst({
            where: {
                id: faqId,
                restaurantId,
            },
        });

        if (!existingFaq) {
            return NextResponse.json(
                { error: 'FAQ not found' },
                { status: 404 }
            );
        }

        log.info('Deleting FAQ', { faqId, userId: user?.id });

        await db.fAQ.delete({
            where: { id: faqId },
        });

        return NextResponse.json({ message: 'FAQ deleted successfully' });
    } catch (error) {
        log.error('Error deleting FAQ', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
