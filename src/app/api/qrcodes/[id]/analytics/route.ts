import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'today';

    if (!id) {
      return NextResponse.json({ error: 'QR code ID is required' }, { status: 400 });
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

    // Get QR code with related data
    const qrCode = await db.qRCode.findUnique({
      where: { id },
      include: {
        customerSessions: {
          where: {
            startedAt: {
              gte: startDate,
              lte: now,
            },
          },
          include: {
            orders: {
              where: {
                createdAt: {
                  gte: startDate,
                  lte: now,
                },
              },
            },
            customerQuestions: {
              where: {
                createdAt: {
                  gte: startDate,
                  lte: now,
                },
              },
            },
          },
        },
        orders: {
          where: {
            createdAt: {
              gte: startDate,
              lte: now,
            },
          },
          include: {
            orderItems: {
              include: {
                menuItem: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
    }

    // Calculate analytics
    const totalScans = qrCode.scanCount;
    const uniqueVisitors = qrCode.customerSessions.length;
    
    // Calculate average session duration
    const sessionDurations = qrCode.customerSessions
      .filter(session => session.lastActivity && session.startedAt)
      .map(session => {
        const start = new Date(session.startedAt).getTime();
        const end = new Date(session.lastActivity).getTime();
        return end - start;
      });

    const averageSessionDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
      : 0;

    // Get popular languages
    const languageUsage = new Map<string, number>();
    qrCode.customerSessions.forEach(session => {
      const lang = session.preferredLanguage;
      languageUsage.set(lang, (languageUsage.get(lang) || 0) + 1);
    });

    const popularLanguages = Array.from(languageUsage.entries())
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count);

    // Get recent activity
    const recentActivity = [];

    // Add scan events
    if (qrCode.lastScanned) {
      recentActivity.push({
        timestamp: qrCode.lastScanned,
        event: 'scan',
        details: 'QR code scanned',
      });
    }

    // Add session events
    qrCode.customerSessions.forEach(session => {
      recentActivity.push({
        timestamp: session.startedAt,
        event: 'session_start',
        details: `Session started (${session.preferredLanguage})`,
      });

      if (session.orders.length > 0) {
        session.orders.forEach(order => {
          recentActivity.push({
            timestamp: order.createdAt,
            event: 'order_placed',
            details: `Order placed - $${order.totalAmount}`,
          });
        });
      }

      if (session.customerQuestions.length > 0) {
        session.customerQuestions.forEach(question => {
          recentActivity.push({
            timestamp: question.createdAt,
            event: 'question_asked',
            details: `Question: ${question.question.substring(0, 50)}...`,
          });
        });
      }
    });

    // Sort by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Get popular menu items from orders
    const menuItemStats = new Map<string, { name: string; count: number; revenue: number }>();
    
    qrCode.orders.forEach(order => {
      order.orderItems.forEach(item => {
        const menuItemName = item.menuItem?.name || 'Unknown Item';
        const itemRevenue = Number(item.totalPrice);
        
        if (menuItemStats.has(menuItemName)) {
          const existing = menuItemStats.get(menuItemName)!;
          existing.count += item.quantity;
          existing.revenue += itemRevenue;
        } else {
          menuItemStats.set(menuItemName, {
            name: menuItemName,
            count: item.quantity,
            revenue: itemRevenue,
          });
        }
      });
    });

    const popularMenuItems = Array.from(menuItemStats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get hourly activity for today
    const hourlyActivity = new Array(24).fill(0);
    if (period === 'today') {
      qrCode.customerSessions.forEach(session => {
        const hour = new Date(session.startedAt).getHours();
        hourlyActivity[hour]++;
      });
    }

    const analytics = {
      totalScans,
      uniqueVisitors,
      averageSessionDuration,
      popularLanguages,
      recentActivity: recentActivity.slice(0, 20), // Limit to 20 most recent
      popularMenuItems,
      hourlyActivity,
      totalOrders: qrCode.orders.length,
      totalRevenue: qrCode.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
      totalQuestions: qrCode.customerSessions.reduce((sum, session) => sum + session.customerQuestions.length, 0),
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
    };

    return NextResponse.json({ success: true, data: analytics });
  } catch (error) {
    console.error('QR code analytics GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 