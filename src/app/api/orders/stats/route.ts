import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');
    const period = searchParams.get('period') || 'today';

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // Get orders for the period
    const orders = await db.order.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        qrCode: {
          select: { id: true, tableNumber: true },
        },
        orderItems: {
          include: {
            menuItem: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Group orders by status
    const ordersByStatus = {
      DRAFT: 0,
      RECEIVED: 0,
      PREPARING: 0,
      READY: 0,
      SERVED: 0,
      CANCELLED: 0,
    };

    orders.forEach(order => {
      ordersByStatus[order.status as keyof typeof ordersByStatus]++;
    });

    // Get recent orders (last 10)
    const recentOrders = orders.slice(0, 10);

    // Get top menu items
    const menuItemStats = new Map<string, { name: string; count: number; revenue: number }>();
    
    orders.forEach(order => {
      order.orderItems?.forEach(item => {
        const menuItemId = item.menuItemId;
        const menuItemName = item.menuItem?.name || 'Unknown Item';
        const itemRevenue = Number(item.totalPrice);
        
        if (menuItemStats.has(menuItemId)) {
          const existing = menuItemStats.get(menuItemId)!;
          existing.count += item.quantity;
          existing.revenue += itemRevenue;
        } else {
          menuItemStats.set(menuItemId, {
            name: menuItemName,
            count: item.quantity,
            revenue: itemRevenue,
          });
        }
      });
    });

    const topMenuItems = Array.from(menuItemStats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get hourly distribution for today
    const hourlyDistribution = new Array(24).fill(0);
    if (period === 'today') {
      orders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        hourlyDistribution[hour]++;
      });
    }

    const stats = {
      totalOrders,
      ordersByStatus,
      totalRevenue,
      averageOrderValue,
      recentOrders,
      topMenuItems,
      hourlyDistribution,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Order stats GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 