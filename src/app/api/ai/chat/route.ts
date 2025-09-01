import { askAiFromDb } from '@/ai/flows/ask-ai-db-flow';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { message, restaurantId, language = 'en' } = await request.json();

        if (!message || !restaurantId) {
            return NextResponse.json(
                { error: 'Message and restaurantId are required' },
                { status: 400 }
            );
        }

        const result = await askAiFromDb({
            restaurantId,
            question: message,
            language,
            includeFaq: true,
        });

        return NextResponse.json({ answer: result.answer });
    } catch (error) {
        console.error('AI chat error:', error);
        return NextResponse.json(
            { error: 'Failed to process chat request' },
            { status: 500 }
        );
    }
}
