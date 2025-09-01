/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/lib/db';
import { requireAuth } from '@/utils/auth-utils';
import { createServiceContext } from '@/utils/service-utils';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('UserService');

export async function GET(request: NextRequest) {
    try {
        const { error, user } = await requireAuth();

        if (error || !user) return error;

        // Only ADMINs can view all users
        // MANAGERs can only view users from their restaurant
        if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
            return NextResponse.json(
                { error: 'Forbidden: Insufficient permissions' },
                { status: 403 }
            );
        }

        const searchParams = request.nextUrl.searchParams;

        const page = Number(searchParams.get('page')) || 1;
        const limit = Number(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        const sortOrder =
            searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const finalSortBy = ['name', 'createdAt', 'updatedAt'].includes(sortBy)
            ? sortBy
            : 'createdAt';

        log.info('user GET', { page, limit, search, sortOrder, sortBy });

        const where: any = {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ],
        };

        // If user is a MANAGER, only show users from their restaurant
        if (user.role === 'MANAGER' && user.restaurantId) {
            where.restaurantId = user.restaurantId;
            where.role = 'USER';
        }

        const users = await db.user.findMany({
            skip: (page - 1) * limit,
            take: limit,
            where,
            orderBy: { [finalSortBy]: sortOrder },
        });

        const totalUsers = await db.user.count({ where });

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
        const { error, user } = await requireAuth();

        if (error || !user) return error;

        // Only ADMINs can create users
        // MANAGERs can create users for their restaurant only
        if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
            return NextResponse.json(
                { error: 'Forbidden: Insufficient permissions' },
                { status: 403 }
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

        // MANAGERs can only create users for their own restaurant
        if (user.role === 'MANAGER') {
            if (restaurantId !== user.restaurantId) {
                return NextResponse.json(
                    {
                        error: 'Forbidden: You can only create users for your restaurant',
                    },
                    { status: 403 }
                );
            }
            // MANAGERs cannot create ADMIN users
            if (role === 'ADMIN') {
                return NextResponse.json(
                    { error: 'Forbidden: You cannot create admin users' },
                    { status: 403 }
                );
            }
        }

        log.info('user POST', { ...body, password: '***', userId: user.id });

        const isUserExist = await db.user.findUnique({
            where: { email },
        });

        if (isUserExist) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 400 }
            );
        }

        const newUser = await db.user.create({
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
                where: { id: newUser.id },
                data: { passwordHash: hashedPassword },
            });
        }

        return NextResponse.json(newUser);
    } catch (error) {
        log.error('user POST error', error);

        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
