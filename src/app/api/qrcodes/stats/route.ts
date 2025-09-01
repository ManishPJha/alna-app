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

    // Get QR codes for the restaurant
    const qrCodes = await db.qRCode.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        customerSessions: {
          where: {
            startedAt: {
              gte: startDate,
              lte: now,
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate statistics
    const totalQRCodes = qrCodes.length;
    const activeQRCodes = qrCodes.filter(qr => qr.isActive).length;
    const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scanCount, 0);
    const averageScansPerCode = totalQRCodes > 0 ? totalScans / totalQRCodes : 0;

    // Get most scanned QR code
    const mostScannedCode = qrCodes.reduce((max, qr) => 
      qr.scanCount > max.scanCount ? qr : max, qrCodes[0] || null
    );

    // Get unique visitors (from customer sessions)
    const uniqueVisitors = new Set();
    qrCodes.forEach(qr => {
      qr.customerSessions.forEach(session => {
        uniqueVisitors.add(session.sessionToken);
      });
    });

    // Get recent activity
    const recentActivity = qrCodes
      .filter(qr => qr.lastScanned)
      .map(qr => ({
        qrCodeId: qr.id,
        tableNumber: qr.tableNumber,
        event: 'scan',
        timestamp: qr.lastScanned!,
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // Get scans by date
    const scansByDate = new Map<string, number>();
    qrCodes.forEach(qr => {
      if (qr.lastScanned) {
        const date = new Date(qr.lastScanned).toISOString().split('T')[0];
        scansByDate.set(date, (scansByDate.get(date) || 0) + qr.scanCount);
      }
    });

    // Get top QR codes by scan count
    const topQRCodes = qrCodes
      .sort((a, b) => b.scanCount - a.scanCount)
      .slice(0, 5)
      .map(qr => ({
        ...qr,
        scanCount: qr.scanCount,
      }));

    // Get hourly distribution for today
    const hourlyDistribution = new Array(24).fill(0);
    if (period === 'today') {
      qrCodes.forEach(qr => {
        if (qr.lastScanned) {
          const hour = new Date(qr.lastScanned).getHours();
          hourlyDistribution[hour]++;
        }
      });
    }

    // Get language usage from customer sessions
    const languageUsage = new Map<string, number>();
    qrCodes.forEach(qr => {
      qr.customerSessions.forEach(session => {
        const lang = session.preferredLanguage;
        languageUsage.set(lang, (languageUsage.get(lang) || 0) + 1);
      });
    });

    const popularLanguages = Array.from(languageUsage.entries())
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const stats = {
      totalQRCodes,
      activeQRCodes,
      totalScans,
      uniqueVisitors: uniqueVisitors.size,
      averageScansPerCode,
      mostScannedCode,
      recentActivity,
      scansByDate: Array.from(scansByDate.entries()).map(([date, scans]) => ({ date, scans })),
      topQRCodes,
      hourlyDistribution,
      popularLanguages,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('QR code stats GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 