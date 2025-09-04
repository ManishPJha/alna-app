'use client';

import { DatePicker, RestaurantSelector } from '@/components/common';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useOrdersByRestaurant } from '@/hooks/orders/useOrders';
import { useRestaurants } from '@/hooks/restaurants/useRestaurants';
import { Order } from '@/service/orders';
import { Calendar, Clock, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const OrderHistoryPageClient = () => {
    const { data: restaurantsData, isLoading: restaurantsLoading } =
        useRestaurants({
            page: 1,
            limit: 50,
        });
    const restaurants = useMemo(
        () => restaurantsData?.restaurants || [],
        [restaurantsData?.restaurants]
    );
    const [selectedRestaurantId, setSelectedRestaurantId] =
        useState<string>('');

    useEffect(() => {
        if (!selectedRestaurantId && restaurants.length > 0) {
            setSelectedRestaurantId(restaurants[0].id);
        }
    }, [restaurants, selectedRestaurantId]);

    // Date filters
    const [dateQuick, setDateQuick] = useState<
        'today' | 'yesterday' | 'last7' | 'last30' | ''
    >('today');
    const [from, setFrom] = useState<string>('');
    const [to, setTo] = useState<string>('');
    const [sort, setSort] = useState<'createdAt:desc' | 'createdAt:asc'>(
        'createdAt:desc'
    );

    const { startDate, endDate } = useMemo(() => {
        if (from || to) {
            return {
                startDate: from || undefined,
                endDate: to || undefined,
            } as { startDate?: string; endDate?: string };
        }
        const start = new Date();
        const end = new Date();
        if (dateQuick === 'today') {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (dateQuick === 'yesterday') {
            start.setDate(start.getDate() - 1);
            end.setDate(end.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (dateQuick === 'last7') {
            start.setDate(start.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (dateQuick === 'last30') {
            start.setDate(start.getDate() - 29);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else {
            // default fallback: last 7 days
            start.setDate(start.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        }
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    }, [dateQuick, from, to]);

    const [sortBy, sortOrder] = sort.split(':') as [
        'createdAt',
        'asc' | 'desc'
    ];

    const { data, isLoading, isFetching, error, refetch } =
        useOrdersByRestaurant(selectedRestaurantId, {
            startDate,
            endDate,
            sortBy,
            sortOrder,
        });
    const orders = useMemo(() => data?.orders || [], [data?.orders]);

    const groupedByDay = useMemo(() => {
        const groups: Record<string, Order[]> = {};
        orders.forEach((o) => {
            const d = new Date(o.createdAt);
            const key = d.toLocaleDateString();
            groups[key] = groups[key] || [];
            groups[key].push(o);
        });
        // Sort days desc
        return Object.entries(groups)
            .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
            .map(([k, v]) => ({ day: k, items: v }));
    }, [orders]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-600 rounded-2xl" />
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-1">
                                Order History
                            </h1>
                            <p className="text-indigo-100 text-sm">
                                Review orders by date range
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                                <Calendar className="h-10 w-10 text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Restaurant selector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <RestaurantSelector
                        restaurants={restaurants}
                        selectedRestaurantId={selectedRestaurantId}
                        onRestaurantChange={setSelectedRestaurantId}
                        isLoading={restaurantsLoading}
                        placeholder="Select restaurant"
                    />
                    <div className="flex items-end">
                        <Button
                            onClick={() => refetch()}
                            disabled={isLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <RefreshCw
                                className={`w-4 h-4 mr-2 ${
                                    isLoading ? 'animate-spin' : ''
                                }`}
                            />{' '}
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                    <div className="w-full lg:w-56">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quick date
                        </label>
                        <Select
                            value={dateQuick || undefined}
                            onValueChange={(v) => {
                                setDateQuick(v as any);
                                setFrom('');
                                setTo('');
                            }}
                        >
                            <SelectTrigger className="w-full bg-white border border-gray-300 text-gray-900">
                                <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                            <SelectContent className="bg-white text-gray-900 border border-gray-200">
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="yesterday">
                                    Yesterday
                                </SelectItem>
                                <SelectItem value="last7">
                                    Last 7 days
                                </SelectItem>
                                <SelectItem value="last30">
                                    Last 30 days
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end gap-3 w-full max-w-md">
                        <DatePicker
                            label="From"
                            value={from}
                            onChange={(iso) => {
                                setFrom(iso);
                                setDateQuick('');
                            }}
                        />
                        <DatePicker
                            label="To"
                            value={to}
                            onChange={(iso) => {
                                setTo(iso);
                                setDateQuick('');
                            }}
                        />
                    </div>

                    <div className="w-full lg:w-56">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sort
                        </label>
                        <Select
                            value={sort}
                            onValueChange={(v) => setSort(v as any)}
                        >
                            <SelectTrigger className="w-full bg-white border border-gray-300 text-gray-900">
                                <SelectValue placeholder="Sort" />
                            </SelectTrigger>
                            <SelectContent className="bg-white text-gray-900 border border-gray-200">
                                <SelectItem value="createdAt:desc">
                                    Newest first
                                </SelectItem>
                                <SelectItem value="createdAt:asc">
                                    Oldest first
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1" />
                    <div className="text-sm text-gray-600">
                        {orders.length} orders
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">
                    {error instanceof Error ? error.message : String(error)}
                </div>
            )}

            {/* Results */}
            <div className="space-y-6 relative">
                {/* Initial skeleton only when no data yet */}
                {isLoading && orders.length === 0 && (
                    <>
                        {[1, 2, 3].map((g) => (
                            <div
                                key={`sk-${g}`}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse"
                            >
                                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                    <div className="h-4 w-40 bg-gray-200 rounded" />
                                    <div className="h-3 w-16 bg-gray-200 rounded" />
                                </div>
                                <div className="divide-y">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="px-4 py-3 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-4 w-16 bg-gray-200 rounded" />
                                                <div className="h-6 w-24 bg-gray-200 rounded" />
                                                <div className="h-4 w-28 bg-gray-200 rounded" />
                                            </div>
                                            <div className="h-4 w-20 bg-gray-200 rounded" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {/* Content keeps rendering even while fetching to avoid flicker */}
                {groupedByDay.map((group) => (
                    <div
                        key={group.day}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <div className="font-semibold text-gray-900">
                                {group.day}
                            </div>
                            <div className="text-sm text-gray-600">
                                {group.items.length} orders
                            </div>
                        </div>
                        <div className="divide-y">
                            {group.items.map((o) => (
                                <div
                                    key={o.id}
                                    className="px-4 py-3 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            {new Date(
                                                o.createdAt
                                            ).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                        {o.qrCode?.tableNumber && (
                                            <div className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                                Table {o.qrCode.tableNumber}
                                            </div>
                                        )}
                                        <div className="text-sm text-gray-500">
                                            Status:{' '}
                                            <span className="font-medium text-gray-800">
                                                {o.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold text-gray-900">
                                            {Number(o.totalAmount ?? 0).toFixed(
                                                2
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Items:{' '}
                                            {o.orderItems?.reduce(
                                                (acc, it) => acc + it.quantity,
                                                0
                                            ) || 0}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {!isLoading && orders.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                        No orders for the selected period.
                    </div>
                )}

                {/* Subtle overlay while background fetching to reduce blink */}
                {isFetching && orders.length > 0 && (
                    <div className="pointer-events-none absolute inset-0">
                        <div className="h-1 w-full bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200 animate-pulse rounded" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistoryPageClient;
