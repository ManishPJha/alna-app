import { auth } from '@/features/auth/handlers';
import { NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: Request) {
    const session = await auth();

    if (!session?.user) {
        return new NextResponse(
            JSON.stringify({
                status: 'fail',
                message: 'You are not logged in',
            }),
            { status: 401 }
        );
    }

    return NextResponse.json({
        authenticated: !!session,
        session,
    });
}
