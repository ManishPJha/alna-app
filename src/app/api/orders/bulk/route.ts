import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderIds, status } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'orderIds array is required' }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['DRAFT', 'RECEIVED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update all orders in a transaction
    const result = await db.$transaction(async (tx) => {
      const updatedOrders = await tx.order.updateMany({
        where: {
          id: {
            in: orderIds,
          },
        },
        data: {
          status: status,
          updatedAt: new Date(),
        },
      });

      // Fetch the updated orders to return
      const orders = await tx.order.findMany({
        where: {
          id: {
            in: orderIds,
          },
        },
        include: {
          qrCode: true,
          orderItems: {
            include: {
              menuItem: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      return {
        updated: updatedOrders.count,
        orders,
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: `Successfully updated ${result.updated} orders to ${status}`
    });
  } catch (error) {
    console.error('Bulk order update error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 