import { db } from '@/lib/db';
import { requireRestaurantAccess } from '@/utils/auth-utils';
import { createServiceContext } from '@/utils/service-utils';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('FAQService');

interface RouteParams {
    params: Promise<{
        restaurantId: string;
    }>;
}

// GET /api/restaurants/[restaurantId]/faqs - Get FAQs (public for customers)
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { restaurantId } = await params;

        // Public endpoint - no authentication required for viewing FAQs
        log.info('Fetching FAQs', { restaurantId });

        const faqs = await db.fAQ.findMany({
            where: {
                restaurantId,
                isActive: true,
            },
            orderBy: { viewCount: 'desc' },
        });

        return NextResponse.json(faqs);
    } catch (error) {
        log.error('Error fetching FAQs', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/restaurants/[restaurantId]/faqs - Create FAQ (requires auth)
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { restaurantId } = await params;
        const { error, user } = await requireRestaurantAccess(restaurantId);

        if (error) return error;

        const body = await request.json();
        const { question, answer, category } = body;

        if (!question || !answer) {
            return NextResponse.json(
                { error: 'Question and answer are required' },
                { status: 400 }
            );
        }

        log.info('Creating FAQ', { restaurantId, userId: user?.id });

        const faq = await db.fAQ.create({
            data: {
                restaurantId,
                question,
                answer,
                category,
            },
        });

        return NextResponse.json(faq);
    } catch (error) {
        log.error('Error creating FAQ', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
