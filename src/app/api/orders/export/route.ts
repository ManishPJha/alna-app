import { db } from '@/lib/db';
import { OrderStatus } from '@/service/orders';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    if (!['csv', 'json'].includes(format)) {
      return NextResponse.json({ error: 'format must be csv or json' }, { status: 400 });
    }

    // Build where clause
    const where: { restaurantId: string; createdAt?: { gte?: Date; lte?: Date }; status?: OrderStatus } = { restaurantId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    if (status) {
      where.status = status as OrderStatus;
    }

    // Fetch orders with related data
    const orders = await db.order.findMany({
      where,
      include: {
        qrCode: {
          select: { tableNumber: true },
        },
        orderItems: {
          include: {
            menuItem: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: orders,
        exportInfo: {
          restaurantId,
          totalOrders: orders.length,
          dateRange: { startDate, endDate },
          exportedAt: new Date().toISOString(),
        },
      });
    }

    // Generate CSV
    const csvHeaders = [
      'Order ID',
      'Status',
      'Total Amount',
      'Table Number',
      'Customer Language',
      'Special Requests',
      'Created At',
      'Updated At',
      'Order Items',
    ];

    const csvRows = orders.map(order => {
      const orderItems = order.orderItems?.map(item => 
        `${item.menuItem?.name || 'Unknown'} (${item.quantity}x $${item.unitPrice})`
      ).join('; ') || '';

      return [
        order.id,
        order.status,
        order.totalAmount.toString(),
        order.qrCode?.tableNumber || '',
        order.customerLanguage,
        order.specialRequests || '',
        order.createdAt.toISOString(),
        order.updatedAt.toISOString(),
        orderItems,
      ];
    });

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orders-${restaurantId}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Order export error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 