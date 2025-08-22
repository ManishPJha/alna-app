import { getSession } from '@/features/auth';
import { db } from '@/lib/db';
import { createServiceContext } from '@/utils/service-utils';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('RestaurantService');

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

        log.info('restaurant GET', { page, limit });

        const restaurants = await db.restaurant.findMany({
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        const totalRestaurants = await db.restaurant.count();

        const pagination = {
            total: totalRestaurants,
            page,
            limit,
            totalPages: Math.ceil(totalRestaurants / limit),
            hasMore: page < Math.ceil(totalRestaurants / limit),
        };

        return NextResponse.json({ restaurants, pagination });
    } catch (error) {
        log.error('restaurant GET error', error);

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
        const {
            name,
            description,
            address,
            phone,
            email,
            defaultLanguage,
            timezone,
            logoUrl,
            themeColor,
        } = body;

        if (!name || !address) {
            return NextResponse.json(
                { error: 'name and address are required' },
                { status: 400 }
            );
        }

        log.info('restaurant POST', body);

        const restaurant = await db.restaurant.create({
            data: {
                name,
                address,
                description,
                phone,
                email,
                defaultLanguage,
                timezone,
                logoUrl,
                themeColor,
            },
        });

        return NextResponse.json(restaurant);
    } catch (error) {
        log.error('restaurant POST error', error);

        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
