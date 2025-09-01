import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/qrcodes/[id]
export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await _req.json();
    const { tableNumber, isActive } = body ?? {};

    const updated = await db.qRCode.update({
      where: { id },
      data: {
        ...(typeof tableNumber === 'string' ? { tableNumber } : {}),
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
      },
    });

    return NextResponse.json({ success: true, qrCode: updated });
  } catch (error) {
    console.error('Manager QR PATCH error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/qrcodes/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.qRCode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Manager QR DELETE error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
