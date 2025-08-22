import { getSession } from '@/features/auth';
import { db } from '@/lib/db';
import { createServiceContext } from '@/utils/service-utils';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('MenuService');

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = params;

        log.info('menu GET by id', { id });

        const menu = await db.menuItem.findUnique({
            where: { id },
            include: {
                category: {
                    include: {
                        menuItems: true,
                        restaurant: true,
                    },
                },
            },
        });

        log.info('menu GET by id result', { menu });

        if (!menu) {
            return NextResponse.json(
                { error: 'Menu not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ menu });
    } catch (error) {
        log.error('menu GET by id error', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
