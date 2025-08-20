import { askAiFromDb } from '@/ai/flows/ask-ai-db-flow';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<Response> {
    try {
        const body = await request.json();
        const restaurantId = body?.restaurantId as string | undefined;
        const question = body?.question as string | undefined;
        const includeFaq = (body?.includeFaq as boolean | undefined) ?? true;

        if (!restaurantId || !question) {
            return NextResponse.json(
                { error: 'restaurantId and question are required' },
                { status: 400 }
            );
        }

        const { answer } = await askAiFromDb({ restaurantId, question, includeFaq });
        return NextResponse.json({ answer });
    } catch (error) {
        console.error('ask-ai POST error', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

