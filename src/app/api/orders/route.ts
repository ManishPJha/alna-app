// import { db } from '@/lib/db';
// import { createServiceContext } from '@/utils/service-utils';
// import { NextRequest, NextResponse } from 'next/server';

// const { log } = createServiceContext('OrderService');

// export async function POST(request: NextRequest) {
//     try {
//         const body = await request.json();
//         const { items, total, specialRequests, tableNumber } = body;

//         if (!items || items.length === 0) {
//             return NextResponse.json(
//                 { error: 'No items in order' },
//                 { status: 400 }
//             );
//         }

//         log.info('Creating order', { itemCount: items.length, total });

//         // Create the order in the database
//         const order = await db.order.create({
//             data: {
//                 restaurantId: items[0].restaurantId || 'default-restaurant-id', // You'll need to pass this
//                 customerLanguage: 'en',
//                 originalLanguage: 'en',
//                 totalAmount: total,
//                 specialRequests,
//                 status: 'SUBMITTED',
//                 submittedAt: new Date(),
//                 orderItems: {
//                     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                     create: items.map((item: any) => ({
//                         menuItemId: item.id,
//                         quantity: item.quantity,
//                         unitPrice: item.price,
//                         totalPrice: item.price * item.quantity,
//                     })),
//                 },
//             },
//         });

//         // Track analytics
//         await db.menuAnalytics.create({
//             data: {
//                 restaurantId: order.restaurantId,
//                 eventType: 'ADD_TO_ORDER',
//                 languageCode: 'en',
//                 metadata: { orderId: order.id, tableNumber },
//             },
//         });

//         return NextResponse.json({
//             orderId: order.id,
//             message: 'Order placed successfully',
//         });
//     } catch (error) {
//         log.error('Order creation error', error);
//         return NextResponse.json(
//             { error: 'Failed to create order' },
//             { status: 500 }
//         );
//     }
// }

// export async function GET(request: NextRequest) {
//     try {
//         const searchParams = request.nextUrl.searchParams;
//         const orderId = searchParams.get('id');

//         if (orderId) {
//             const order = await db.order.findUnique({
//                 where: { id: orderId },
//                 include: {
//                     orderItems: {
//                         include: {
//                             menuItem: true,
//                         },
//                     },
//                 },
//             });

//             if (!order) {
//                 return NextResponse.json(
//                     { error: 'Order not found' },
//                     { status: 404 }
//                 );
//             }

//             return NextResponse.json(order);
//         }

//         // Return list of orders (you might want to add pagination)
//         const orders = await db.order.findMany({
//             orderBy: { createdAt: 'desc' },
//             take: 10,
//         });

//         return NextResponse.json(orders);
//     } catch (error) {
//         log.error('Order fetch error', error);
//         return NextResponse.json(
//             { error: 'Failed to fetch orders' },
//             { status: 500 }
//         );
//     }
// }



import { db } from '@/lib/db';
import { OrderStatus } from '@/service/orders';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/orders?restaurantId=...&status=RECEIVED
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId') || '';
    const status = searchParams.get('status') || undefined;

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    const where: { restaurantId: string; status?: OrderStatus } = { restaurantId };
    if (status) where.status = status as OrderStatus;

    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
      take: 100,
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Manager orders GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH /api/orders - Update order status
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['DRAFT', 'RECEIVED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: { status: status },
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

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Manager orders PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
