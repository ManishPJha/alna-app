import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const isActive = searchParams.get('isActive');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    if (!['csv', 'json'].includes(format)) {
      return NextResponse.json({ error: 'format must be csv or json' }, { status: 400 });
    }

    // Build where clause
    const where: { restaurantId: string; createdAt?: { gte?: Date; lte?: Date }; isActive?: boolean } = { restaurantId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Fetch QR codes with related data
    const qrCodes = await db.qRCode.findMany({
      where,
      include: {
        customerSessions: {
          select: { id: true, startedAt: true, preferredLanguage: true },
        },
        orders: {
          select: { id: true, totalAmount: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: qrCodes,
        exportInfo: {
          restaurantId,
          totalQRCodes: qrCodes.length,
          dateRange: { startDate, endDate },
          exportedAt: new Date().toISOString(),
        },
      });
    }

    // Generate CSV
    const csvHeaders = [
      'QR Code ID',
      'Table Number',
      'QR Token',
      'Status',
      'Scan Count',
      'Last Scanned',
      'Created At',
      'Updated At',
      'Total Sessions',
      'Total Orders',
      'Total Revenue',
      'Popular Languages',
    ];

    const csvRows = qrCodes.map(qrCode => {
      // Calculate derived data
      const totalSessions = qrCode.customerSessions.length;
      const totalOrders = qrCode.orders.length;
      const totalRevenue = qrCode.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      
      // Get popular languages
      const languageUsage = new Map<string, number>();
      qrCode.customerSessions.forEach(session => {
        const lang = session.preferredLanguage;
        languageUsage.set(lang, (languageUsage.get(lang) || 0) + 1);
      });
      const popularLanguages = Array.from(languageUsage.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([lang, count]) => `${lang}(${count})`)
        .join('; ');

      return [
        qrCode.id,
        qrCode.tableNumber || '',
        qrCode.qrToken,
        qrCode.isActive ? 'Active' : 'Inactive',
        qrCode.scanCount.toString(),
        qrCode.lastScanned ? new Date(qrCode.lastScanned).toISOString() : '',
        new Date(qrCode.createdAt).toISOString(),
        new Date(qrCode.updatedAt).toISOString(),
        totalSessions.toString(),
        totalOrders.toString(),
        totalRevenue.toFixed(2),
        popularLanguages,
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
        'Content-Disposition': `attachment; filename="qr-codes-${restaurantId}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('QR code export error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 