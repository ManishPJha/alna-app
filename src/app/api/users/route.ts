import { getSession } from '@/features/auth';
import { db } from '@/lib/db';
import { createServiceContext } from '@/utils/service-utils';
import bcrypt from 'bcryptjs';
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
        const search = searchParams.get('search') || '';
        // const sortBy = searchParams.get('sortBy') || 'createdAt';
        // const sortOrder =
        //     searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

        log.info('user GET', { page, limit });

        const users = await db.user.findMany({
            skip: (page - 1) * limit,
            take: limit,
            where: {
                role: 'MANAGER',
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });

        const totalUsers = await db.user.count({ where: { role: 'MANAGER' } });

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
        const { name, email, restaurantId, password, role, isActive } = body;

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
                role: role || 'MANAGER',
                restaurantId,
                isActive: isActive ?? true,
            },
        });

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.user.update({
                where: { id: user.id },
                data: { passwordHash: hashedPassword },
            });
        }

        return NextResponse.json(user);
    } catch (error) {
        log.error('user POST error', error);

        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
