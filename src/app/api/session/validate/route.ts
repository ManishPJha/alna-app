import { auth } from '@/features/auth/handlers';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Get the session using NextAuth
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ valid: false }, { status: 200 });
        }

        // Additional check: verify user exists and is active
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, isActive: true },
        });

        const isValid = !!user && user.isActive;

        console.log('Session validation API - isValid:', isValid);

        return NextResponse.json({ valid: isValid });
    } catch (error) {
        console.error('Session validation API error:', error);
        return NextResponse.json({ valid: false }, { status: 200 });
    }
}

// Ensure this API route doesn't get cached
export const dynamic = 'force-dynamic';
export const revalidate = 0;
