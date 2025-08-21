'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface DashboardChartsProps {
    data: Array<{
        name: string;
        restaurants: number;
        qrCodes: number;
        scans: number;
    }>;
    userRole: string;
}

export function DashboardCharts({ data, userRole }: DashboardChartsProps) {
    // Custom colors for charts
    const colors = {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#F59E0B',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
    };

    // Pie chart data for QR code distribution
    const qrCodeDistribution = [
        {
            name: 'Active',
            value: data.reduce((sum, item) => sum + item.qrCodes, 0) * 0.7,
            color: colors.success,
        },
        {
            name: 'Inactive',
            value: data.reduce((sum, item) => sum + item.qrCodes, 0) * 0.2,
            color: colors.warning,
        },
        {
            name: 'Pending',
            value: data.reduce((sum, item) => sum + item.qrCodes, 0) * 0.1,
            color: colors.danger,
        },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Growth Chart */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Monthly Growth Trends
                        <div className="flex space-x-2">
                            <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700"
                            >
                                Restaurants
                            </Badge>
                            <Badge
                                variant="outline"
                                className="bg-purple-50 text-purple-700"
                            >
                                QR Codes
                            </Badge>
                            <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700"
                            >
                                Scans
                            </Badge>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#f0f0f0"
                            />
                            <XAxis
                                dataKey="name"
                                stroke="#6b7280"
                                fontSize={12}
                            />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow:
                                        '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="restaurants"
                                stroke={colors.primary}
                                strokeWidth={3}
                                dot={{
                                    fill: colors.primary,
                                    strokeWidth: 2,
                                    r: 4,
                                }}
                                activeDot={{
                                    r: 6,
                                    stroke: colors.primary,
                                    strokeWidth: 2,
                                }}
                                name="Restaurants"
                            />
                            <Line
                                type="monotone"
                                dataKey="qrCodes"
                                stroke={colors.secondary}
                                strokeWidth={3}
                                dot={{
                                    fill: colors.secondary,
                                    strokeWidth: 2,
                                    r: 4,
                                }}
                                activeDot={{
                                    r: 6,
                                    stroke: colors.secondary,
                                    strokeWidth: 2,
                                }}
                                name="QR Codes"
                            />
                            <Line
                                type="monotone"
                                dataKey="scans"
                                stroke={colors.success}
                                strokeWidth={3}
                                dot={{
                                    fill: colors.success,
                                    strokeWidth: 2,
                                    r: 4,
                                }}
                                activeDot={{
                                    r: 6,
                                    stroke: colors.success,
                                    strokeWidth: 2,
                                }}
                                name="Scans"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Restaurant Growth Bar Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Restaurant Growth</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#f0f0f0"
                            />
                            <XAxis
                                dataKey="name"
                                stroke="#6b7280"
                                fontSize={12}
                            />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow:
                                        '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                }}
                            />
                            <Bar
                                dataKey="restaurants"
                                fill={colors.primary}
                                radius={[4, 4, 0, 0]}
                                name="New Restaurants"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* QR Code Distribution Pie Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>QR Code Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={qrCodeDistribution}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, percent }) =>
                                    percent
                                        ? `${name} ${(percent * 100).toFixed(
                                              0
                                          )}%`
                                        : ''
                                }
                            >
                                {qrCodeDistribution.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow:
                                        '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

// app/(dashboard)/loading.tsx - Dashboard Loading Page
export default function DashboardLoading() {
    return (
        <div className="space-y-8">
            {/* Welcome Section Skeleton */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 animate-pulse">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-8 bg-blue-400 rounded w-64 mb-2"></div>
                        <div className="h-4 bg-blue-300 rounded w-96 mb-4"></div>
                        <div className="flex space-x-3">
                            <div className="h-10 bg-white rounded w-32"></div>
                            <div className="h-10 bg-white/20 rounded w-24"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-white p-6 rounded-lg border animate-pulse"
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                                <div className="h-4 bg-gray-200 rounded w-20"></div>
                            </div>
                            <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg border animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
                <div className="bg-white p-6 rounded-lg border animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="h-48 bg-gray-200 rounded"></div>
                </div>
                <div className="bg-white p-6 rounded-lg border animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="h-48 bg-gray-200 rounded"></div>
                </div>
            </div>

            {/* Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-lg border animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-12 bg-gray-200 rounded"
                            ></div>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-lg border animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center space-x-3"
                            >
                                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
