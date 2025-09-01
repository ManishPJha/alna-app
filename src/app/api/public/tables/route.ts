import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/tables?restaurantId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId') || '';

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    const qrCodes = await db.qRCode.findMany({
      where: {
        restaurantId,
        isActive: true,
        NOT: { tableNumber: null },
      },
      select: { id: true, tableNumber: true },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    const tables = qrCodes
      .map((q) => q.tableNumber)
      .filter((t): t is string => !!t);

    return NextResponse.json({ success: true, tables });
  } catch (error) {
    console.error('Public tables GET error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
