'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useExportQRCodes, useQRCodeStats } from '@/hooks/qrCodes';
import {
    BarChart3,
    Download,
    Eye,
    QrCode,
    ScanLine,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

interface QRCodeDashboardProps {
    restaurantId: string;
}

const STATUS_COLORS = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
};

export function QRCodeDashboard({ restaurantId }: QRCodeDashboardProps) {
    const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
    const { data: stats, isLoading } = useQRCodeStats(
        restaurantId,
        'restaurant',
        period
    );
    const exportQRCodesMutation = useExportQRCodes();

    const handleExport = (format: 'csv' | 'json') => {
        exportQRCodesMutation.mutate({
            targetId: restaurantId,
            type: 'restaurant',
            format,
            filters: { startDate: new Date().toISOString().split('T')[0] },
        });
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!stats) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-gray-500 text-center">
                        No QR code statistics available
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Period Selector and Export */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-2">
                    {(['today', 'week', 'month'] as const).map((p) => (
                        <Button
                            key={p}
                            variant={period === p ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPeriod(p)}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('csv')}
                        disabled={exportQRCodesMutation.isPending}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('json')}
                        disabled={exportQRCodesMutation.isPending}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export JSON
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total QR Codes
                        </CardTitle>
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalQRCodes}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {period === 'today'
                                ? 'Today'
                                : period === 'week'
                                ? 'This week'
                                : 'This month'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active QR Codes
                        </CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.activeQRCodes}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalQRCodes > 0
                                ? `${(
                                      (stats.activeQRCodes /
                                          stats.totalQRCodes) *
                                      100
                                  ).toFixed(1)}% active`
                                : 'No QR codes'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Scans
                        </CardTitle>
                        <ScanLine className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalScans}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Avg: {stats.averageScansPerCode.toFixed(1)} per code
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Unique Visitors
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.uniqueVisitors}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            From customer sessions
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* QR Code Status Breakdown and Top QR Codes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            QR Code Status
                        </CardTitle>
                        <CardDescription>
                            Distribution of QR codes by status for {period}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className={STATUS_COLORS.active}
                                    >
                                        Active
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {stats.activeQRCodes}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        (
                                        {stats.totalQRCodes > 0
                                            ? (
                                                  (stats.activeQRCodes /
                                                      stats.totalQRCodes) *
                                                  100
                                              ).toFixed(1)
                                            : 0}
                                        %)
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className={STATUS_COLORS.inactive}
                                    >
                                        Inactive
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {stats.totalQRCodes -
                                            stats.activeQRCodes}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        (
                                        {stats.totalQRCodes > 0
                                            ? (
                                                  ((stats.totalQRCodes -
                                                      stats.activeQRCodes) /
                                                      stats.totalQRCodes) *
                                                  100
                                              ).toFixed(1)
                                            : 0}
                                        %)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Top QR Codes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Top QR Codes
                        </CardTitle>
                        <CardDescription>
                            Most scanned QR codes for {period}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.topQRCodes.map((qrCode, index) => (
                                <div
                                    key={qrCode.id}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-muted-foreground">
                                            #{index + 1}
                                        </span>
                                        <span className="font-medium">
                                            {qrCode.tableNumber
                                                ? `Table ${qrCode.tableNumber}`
                                                : 'No Table'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">
                                            {qrCode.scanCount} scans
                                        </span>
                                        <Eye className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Most Scanned QR Code */}
            {stats.mostScannedCode && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Most Scanned QR Code
                        </CardTitle>
                        <CardDescription>
                            Your best performing QR code for {period}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <QrCode className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="font-medium">
                                        {stats.mostScannedCode.tableNumber
                                            ? `Table ${stats.mostScannedCode.tableNumber}`
                                            : 'No Table Assigned'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Token:{' '}
                                        {stats.mostScannedCode.qrToken.slice(
                                            0,
                                            8
                                        )}
                                        ...
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-indigo-600">
                                    {stats.mostScannedCode.scanCount}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Total scans
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Popular Languages */}
            {stats.popularLanguages && stats.popularLanguages.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Popular Languages
                        </CardTitle>
                        <CardDescription>
                            Most used languages by customers for {period}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.popularLanguages.map((lang, index) => (
                                <div
                                    key={lang.language}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-muted-foreground">
                                            #{index + 1}
                                        </span>
                                        <span className="font-medium">
                                            {lang.language.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">
                                            {lang.count} sessions
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Activity */}
            {stats.recentActivity && stats.recentActivity.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>
                            Latest QR code activity for {period}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.recentActivity.map((activity, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1 bg-blue-100 rounded">
                                            <ScanLine className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {activity.tableNumber
                                                    ? `Table ${activity.tableNumber}`
                                                    : 'Unknown Table'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {activity.event}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">
                                            {new Date(
                                                activity.timestamp
                                            ).toLocaleTimeString()}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(
                                                activity.timestamp
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
