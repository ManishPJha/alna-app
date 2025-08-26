import { translateMenu } from '@/ai/flows/translate-menu-flow';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { menu, language } = await request.json();

        if (!menu || !language) {
            return NextResponse.json(
                { error: 'Menu and language are required' },
                { status: 400 }
            );
        }

        const translatedMenu = await translateMenu({
            menu,
            language,
        });

        return NextResponse.json(translatedMenu);
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json(
            { error: 'Failed to translate menu' },
            { status: 500 }
        );
    }
}
