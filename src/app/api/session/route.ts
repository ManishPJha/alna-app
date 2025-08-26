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

    const user = await db.user.findUnique({
        where: {
            id: session?.user.id,
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            restaurantId: true,
            isActive: true,
            restaurant: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    if (!user) {
        return new NextResponse(
            JSON.stringify({
                status: 'fail',
                authenticated: false,
                message: 'User not found',
            }),
            { status: 401 }
        );
    }

    if (!user.isActive) {
        return new NextResponse(
            JSON.stringify({
                status: 'fail',
                authenticated: false,
                message: 'User account is deactivated',
            }),
            { status: 403 }
        );
    }

    return NextResponse.json({
        status: 'success',
        authenticated: true,
        session: {
            ...session,
            user: {
                ...session.user,
                role: user.role,
                restaurantId: user.restaurantId,
                restaurantName: user.restaurant?.name,
            },
        },
    });
}
