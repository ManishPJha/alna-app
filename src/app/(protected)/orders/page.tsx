'use client';

import { RestaurantSelector } from '@/components/common';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    useBulkUpdateOrderStatus,
    useOrdersByRestaurant,
    useUpdateOrderStatus,
} from '@/hooks/orders';
import { useRestaurants } from '@/hooks/restaurants/useRestaurants';
import {
    closestCorners,
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CheckSquare, ListOrdered, Plus, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DroppableZone } from './components/DroppableZone';
import { OrderCard } from './components/OrderCard';
import { SortableItem } from './components/SortableItem';

import { Order, OrderStatus } from '@/service/orders';

const ORDER_STATUSES: Array<{
    key: OrderStatus;
    label: string;
    color: string;
}> = [
    {
        key: 'RECEIVED',
        label: 'RECEIVED',
        color: 'bg-blue-50 border-blue-200 text-blue-700',
    },
    {
        key: 'PREPARING',
        label: 'PREPARING',
        color: 'bg-orange-50 border-orange-200 text-orange-700',
    },
    {
        key: 'READY',
        label: 'READY',
        color: 'bg-green-50 border-green-200 text-green-700',
    },
    {
        key: 'SERVED',
        label: 'SERVED',
        color: 'bg-purple-50 border-purple-200 text-purple-700',
    },
    {
        key: 'CANCELLED',
        label: 'CANCELLED',
        color: 'bg-red-50 border-red-200 text-red-700',
    },
];

export default function OrdersRootPage() {
    // Restaurant selection with search and pagination via existing hook
    const [searchQuery, setSearchQuery] = useState('');
    const { data: restaurantsData, isLoading: restaurantsLoading } =
        useRestaurants({
            page: 1,
            limit: 50,
            search: searchQuery,
        });
    const restaurants = useMemo(
        () => restaurantsData?.restaurants || [],
        [restaurantsData?.restaurants]
    );

    const [selectedRestaurantId, setSelectedRestaurantId] =
        useState<string>('');
    useEffect(() => {
        // auto-select first if none selected
        if (!selectedRestaurantId && restaurants.length > 0) {
            setSelectedRestaurantId(restaurants[0].id);
        }
    }, [restaurants, selectedRestaurantId]);

    // Filters and sorting
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>(
        'ALL'
    );
    const [sortBy, setSortBy] = useState<'createdAt' | 'totalAmount'>(
        'createdAt'
    );
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const dateRange = useMemo(() => {
        const start = new Date();
        const end = new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    }, []);

    const effectiveFilters = useMemo(
        () => ({
            status: statusFilter === 'ALL' ? undefined : statusFilter,
            sortBy,
            sortOrder,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
        }),
        [
            statusFilter,
            sortBy,
            sortOrder,
            dateRange.startDate,
            dateRange.endDate,
        ]
    );

    // Orders state using hooks
    const {
        data: ordersData,
        isLoading: loading,
        error,
        refetch,
    } = useOrdersByRestaurant(selectedRestaurantId, effectiveFilters);
    const orders = useMemo(
        () => ordersData?.orders || [],
        [ordersData?.orders]
    );

    const updateOrderStatusMutation = useUpdateOrderStatus();
    const updatingOrder = updateOrderStatusMutation.isPending
        ? updateOrderStatusMutation.variables?.orderId
        : null;
    const bulkUpdateStatus = useBulkUpdateOrderStatus();

    const [activeId, setActiveId] = useState<string | null>(null);
    const [batchMode, setBatchMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelect = (id: string, checked: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    const applyBulkUpdate = (status: OrderStatus) => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        bulkUpdateStatus.mutate(
            { orderIds: ids, status },
            {
                onSuccess: () => {
                    clearSelection();
                    setBatchMode(false);
                },
            }
        );
    };

    // DnD sensors with improved activation constraint
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const updateOrderStatus = async (
        orderId: string,
        newStatus: OrderStatus
    ) => {
        updateOrderStatusMutation.mutate({ orderId, status: newStatus });
    };

    // Group orders by status
    const ordersByStatus = useMemo(() => {
        const grouped: Record<string, Order[]> = {};
        ORDER_STATUSES.forEach((status) => {
            grouped[status.key] = [];
        });

        orders.forEach((order) => {
            if (grouped[order.status]) {
                grouped[order.status].push(order);
            }
        });

        return grouped;
    }, [orders]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        console.log('Drag started:', event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        console.log('Drag end:', {
            active: active.id,
            over: over?.id,
            overData: over?.data,
        });

        if (!over) {
            console.log('No drop target found');
            return;
        }

        const orderId = active.id as string;
        let newStatus = over.id as string;

        // Check if we dropped on a status column directly
        if (ORDER_STATUSES.some((status) => status.key === newStatus)) {
            console.log('Dropped on status column:', newStatus);
        }
        // Check if we dropped on another order card
        else {
            const targetOrder = orders.find((o) => o.id === newStatus);
            if (targetOrder) {
                newStatus = targetOrder.status;
                console.log('Dropped on order card, using status:', newStatus);
            } else {
                console.log('Invalid drop target:', newStatus);
                return;
            }
        }

        // Validate that newStatus is a valid OrderStatus
        if (!ORDER_STATUSES.some((status) => status.key === newStatus)) {
            console.log('Invalid status:', newStatus);
            return;
        }

        // Find the dragged order
        const draggedOrder = orders.find((o) => o.id === orderId);
        if (!draggedOrder || draggedOrder.status === newStatus) {
            console.log('Order not found or already in target status');
            return;
        }

        console.log('Updating order status:', {
            orderId,
            from: draggedOrder.status,
            to: newStatus,
        });
        updateOrderStatus(orderId, newStatus as OrderStatus);
    };

    const activeOrder = activeId
        ? orders.find((order) => order.id === activeId)
        : null;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-600 rounded-2xl" />
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Orders</h1>
                            <p className="text-indigo-100 text-sm">
                                Manage and track order status
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                                <ListOrdered className="h-10 w-10 text-white" />
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
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <RefreshCw
                                className={`w-4 h-4 mr-2 ${
                                    loading ? 'animate-spin' : ''
                                }`}
                            />{' '}
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* Orders count and controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                    <div className="w-full lg:w-56">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <Select
                            value={statusFilter}
                            onValueChange={(v) => setStatusFilter(v as any)}
                        >
                            <SelectTrigger className="w-full bg-white border border-gray-300 text-gray-900">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent className="bg-white text-gray-900 border border-gray-200">
                                <SelectItem value="ALL">All</SelectItem>
                                <SelectItem value="RECEIVED">
                                    Received
                                </SelectItem>
                                <SelectItem value="PREPARING">
                                    Preparing
                                </SelectItem>
                                <SelectItem value="READY">Ready</SelectItem>
                                <SelectItem value="SERVED">Served</SelectItem>
                                <SelectItem value="CANCELLED">
                                    Cancelled
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full lg:w-56">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sort by
                        </label>
                        <Select
                            value={`${sortBy}:${sortOrder}`}
                            onValueChange={(v) => {
                                const [by, order] = v.split(':') as any;
                                setSortBy(by);
                                setSortOrder(order);
                            }}
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
                                <SelectItem value="totalAmount:desc">
                                    Value high → low
                                </SelectItem>
                                <SelectItem value="totalAmount:asc">
                                    Value low → high
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1" />

                    <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-600">
                            {orders.length} orders
                        </div>
                        <Button
                            variant={batchMode ? 'default' : 'outline'}
                            onClick={() => {
                                setBatchMode(!batchMode);
                                if (batchMode) clearSelection();
                            }}
                            className="w-56"
                        >
                            <CheckSquare className="w-4 h-4 mr-2" />{' '}
                            {batchMode ? 'Batch mode on' : 'Batch select'}
                        </Button>
                    </div>
                </div>

                {batchMode && (
                    <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="text-sm text-gray-700">
                            Selected: {selectedIds.size}
                        </div>
                        <div className="w-full sm:w-56">
                            <Select
                                onValueChange={(v) =>
                                    applyBulkUpdate(v as OrderStatus)
                                }
                            >
                                <SelectTrigger className="w-full bg-white border border-gray-300 text-gray-900">
                                    <SelectValue placeholder="Update status to..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white text-gray-900 border border-gray-200">
                                    <SelectItem value="RECEIVED">
                                        Received
                                    </SelectItem>
                                    <SelectItem value="PREPARING">
                                        Preparing
                                    </SelectItem>
                                    <SelectItem value="READY">Ready</SelectItem>
                                    <SelectItem value="SERVED">
                                        Served
                                    </SelectItem>
                                    <SelectItem value="CANCELLED">
                                        Cancelled
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" onClick={clearSelection}>
                            Clear selection
                        </Button>
                    </div>
                )}
            </div>

            {/* Error display */}
            {error && (
                <div className="p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">
                    {error instanceof Error ? error.message : String(error)}
                </div>
            )}

            {/* Kanban Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {ORDER_STATUSES.map((status) => (
                        <div key={status.key} className="relative">
                            <DroppableZone
                                id={status.key}
                                isEmpty={
                                    !ordersByStatus[status.key] ||
                                    ordersByStatus[status.key].length === 0
                                }
                            >
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full min-h-[500px]">
                                    {/* Column Header */}
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 pl-3">
                                                <h3 className="font-semibold text-gray-900 text-sm">
                                                    {status.label}
                                                </h3>
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                                    {ordersByStatus[status.key]
                                                        ?.length || 0}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {/* <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-gray-500" />
                          </button> */}
                                                {/* <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                            <Plus className="w-4 h-4 text-gray-500" />
                          </button> */}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column Content */}
                                    <div className="p-3 flex-1 relative">
                                        {ordersByStatus[status.key] &&
                                        ordersByStatus[status.key].length >
                                            0 ? (
                                            <SortableContext
                                                items={ordersByStatus[
                                                    status.key
                                                ].map((order) => order.id)}
                                                strategy={
                                                    verticalListSortingStrategy
                                                }
                                            >
                                                <div className="space-y-3 min-h-[400px]">
                                                    {ordersByStatus[
                                                        status.key
                                                    ].map((order) => (
                                                        <SortableItem
                                                            key={order.id}
                                                            id={order.id}
                                                        >
                                                            <OrderCard
                                                                order={order}
                                                                isUpdating={
                                                                    updatingOrder ===
                                                                    order.id
                                                                }
                                                                selectable={
                                                                    batchMode
                                                                }
                                                                selected={selectedIds.has(
                                                                    order.id
                                                                )}
                                                                onSelectChange={(
                                                                    checked
                                                                ) =>
                                                                    toggleSelect(
                                                                        order.id,
                                                                        checked
                                                                    )
                                                                }
                                                            />
                                                        </SortableItem>
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        ) : (
                                            <div className="flex items-center justify-center h-80 text-gray-400 min-h-[400px]">
                                                <div className="text-center">
                                                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <Plus className="w-8 h-8" />
                                                    </div>
                                                    <p className="text-base font-medium">
                                                        No orders
                                                    </p>
                                                    <p className="text-sm text-gray-400 mt-2">
                                                        Drop orders here
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </DroppableZone>
                        </div>
                    ))}
                </div>

                {/* Drag Overlay */}
                <DragOverlay dropAnimation={null}>
                    {activeOrder ? (
                        <div className="transform rotate-3 scale-105 shadow-2xl">
                            <OrderCard
                                order={activeOrder}
                                isDragging
                                isUpdating={updatingOrder === activeOrder.id}
                                selectable={false}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Loading state */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-gray-500">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading orders...
                    </div>
                </div>
            )}
        </div>
    );
}
