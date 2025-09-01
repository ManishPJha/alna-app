import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/qr?token=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'token is required' }, { status: 400 });

    const qr = await db.qRCode.findUnique({ where: { qrToken: token }, select: { id: true, restaurantId: true, tableNumber: true, isActive: true } });
    if (!qr || !qr.isActive) return NextResponse.json({ error: 'QR not found' }, { status: 404 });

    return NextResponse.json({ success: true, qr });
  } catch (error) {
    console.error('Public QR GET error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
