import { auth } from '@/features/auth/handlers';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: Request) {
    const session = await auth();

    if (!session?.user) {
        return new NextResponse(
            JSON.stringify({
                status: 'fail',
                authenticated: false,
                message: 'You are not logged in',
            }),
            { status: 401 }
        );
    }

    const isUserExist = await db.user.findUnique({
        where: {
            id: session?.user.id,
        },
    });

    if (!isUserExist) {
        return new NextResponse(
            JSON.stringify({
                status: 'fail',
                authenticated: false,
                message: 'You are not logged in',
            }),
            { status: 401 }
        );
    }

    return NextResponse.json({
        status: 'success',
        authenticated: !!session,
        session,
    });
}
