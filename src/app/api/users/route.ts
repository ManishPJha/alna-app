import { getSession } from '@/features/auth';
import { db } from '@/lib/db';
import { createServiceContext } from '@/utils/service-utils';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('UserService');

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;

        const page = Number(searchParams.get('page')) || 1;
        const limit = Number(searchParams.get('limit')) || 10;

        log.info('user GET', { page, limit });

        const users = await db.user.findMany({
            skip: (page - 1) * limit,
            take: limit,
            where: { role: 'MANAGER' },
        });

        const totalUsers = await db.user.count();

        const pagination = {
            total: totalUsers,
            page,
            limit,
            totalPages: Math.ceil(totalUsers / limit),
            hasMore: page < Math.ceil(totalUsers / limit),
        };

        return NextResponse.json({ users, pagination });
    } catch (error) {
        log.error('user GET error', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, email, restaurantId } = body;

        if (!name || !email) {
            return NextResponse.json(
                { error: 'name and email are required' },
                { status: 400 }
            );
        }

        log.info('user POST', body);

        const user = await db.user.create({
            data: {
                name,
                email,
                role: 'MANAGER',
                restaurantId,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        log.error('user POST error', error);

        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
