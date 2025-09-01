/* eslint-disable @typescript-eslint/no-explicit-any */
import { queryKeys } from '@/lib/query-client';
import { OrderFilters, OrderStatus, orderService } from '@/service/orders';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';

// Get all orders with caching and filtering
export function useOrders(filters?: OrderFilters) {
    return useQuery({
        queryKey: queryKeys.orders.list(filters),
        queryFn: () => orderService.getAll(filters),
        select: (data) => ({
            orders: data.data?.orders || [],
            pagination: data.data?.pagination,
        }),
        placeholderData: (previousData) => previousData,
    });
}

// Get orders by restaurant
export function useOrdersByRestaurant(restaurantId: string, filters?: Omit<OrderFilters, 'restaurantId'>) {
    return useQuery({
        queryKey: queryKeys.orders.byRestaurant(restaurantId, filters),
        queryFn: () => orderService.getByRestaurant(restaurantId, filters),
        select: (data) => ({
            orders: data.data?.orders || [],
            pagination: data.data?.pagination,
        }),
        enabled: !!restaurantId,
        placeholderData: (previousData) => previousData,
        refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
    });
}

// Get single order with caching
export function useOrder(id: string) {
    return useQuery({
        queryKey: queryKeys.orders.detail(id),
        queryFn: () => orderService.getById(id),
        select: (data) => data.data,
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // Order details are stable for 5 minutes
    });
}

// Get order statistics
export function useOrderStats(restaurantId: string, period?: 'today' | 'week' | 'month') {
    return useQuery({
        queryKey: queryKeys.orders.stats(restaurantId, period),
        queryFn: () => orderService.getStats(restaurantId, period),
        select: (data) => data.data,
        enabled: !!restaurantId,
        refetchInterval: 5 * 60 * 1000, // Refresh stats every 5 minutes
    });
}

// Update order status mutation
export function useUpdateOrderStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
            orderService.updateStatus(orderId, status),
        onMutate: async ({ orderId, status }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({
                queryKey: queryKeys.orders.lists(),
            });

            // Snapshot previous values
            const previousOrders = queryClient.getQueriesData({
                queryKey: queryKeys.orders.lists(),
            });

            // Optimistically update all order lists
            queryClient.setQueriesData(
                { queryKey: queryKeys.orders.lists() },
                (old: any) => {
                    if (!old?.data?.orders) return old;

                    return {
                        ...old,
                        data: {
                            ...old.data,
                            orders: old.data.orders.map((order: any) =>
                                order.id === orderId
                                    ? { ...order, status, updatedAt: new Date().toISOString() }
                                    : order
                            ),
                        },
                    };
                }
            );

            return { previousOrders };
        },
        onError: (err, { orderId }, context) => {
            // Rollback on error
            if (context?.previousOrders) {
                context.previousOrders.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(`Failed to update order status: ${err.message}`);
        },
        onSuccess: (data, { orderId, status }) => {
            toast.success(`Order status updated to ${status}`, {
                id: `order-update-${orderId}`,
                duration: 3000,
            });
        },
        onSettled: () => {
            // Refetch all order lists to ensure consistency
            queryClient.invalidateQueries({
                queryKey: queryKeys.orders.lists(),
            });
        },
    });
}

// Bulk update order statuses mutation
export function useBulkUpdateOrderStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ orderIds, status }: { orderIds: string[]; status: OrderStatus }) =>
            orderService.bulkUpdateStatus(orderIds, status),
        onMutate: async ({ orderIds, status }) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.orders.lists(),
            });

            const previousOrders = queryClient.getQueriesData({
                queryKey: queryKeys.orders.lists(),
            });

            // Optimistically update all order lists
            queryClient.setQueriesData(
                { queryKey: queryKeys.orders.lists() },
                (old: any) => {
                    if (!old?.data?.orders) return old;

                    return {
                        ...old,
                        data: {
                            ...old.data,
                            orders: old.data.orders.map((order: any) =>
                                orderIds.includes(order.id)
                                    ? { ...order, status, updatedAt: new Date().toISOString() }
                                    : order
                            ),
                        },
                    };
                }
            );

            return { previousOrders };
        },
        onError: (err, { orderIds }, context) => {
            if (context?.previousOrders) {
                context.previousOrders.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(`Failed to update ${orderIds.length} orders: ${err.message}`);
        },
        onSuccess: (data, { orderIds, status }) => {
            toast.success(`Updated ${orderIds.length} orders to ${status}`, {
                duration: 3000,
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.orders.lists(),
            });
        },
    });
}

// Create order mutation
export function useCreateOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => orderService.create(data),
        onMutate: async (newOrder) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.orders.lists(),
            });

            const previousOrders = queryClient.getQueriesData({
                queryKey: queryKeys.orders.lists(),
            });

            // Optimistically add the new order
            queryClient.setQueriesData(
                { queryKey: queryKeys.orders.lists() },
                (old: any) => {
                    if (!old?.data?.orders) return old;

                    const optimisticOrder = {
                        id: `temp-${Date.now()}`,
                        ...newOrder,
                        status: 'DRAFT',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };

                    return {
                        ...old,
                        data: {
                            ...old.data,
                            orders: [optimisticOrder, ...old.data.orders],
                        },
                    };
                }
            );

            return { previousOrders };
        },
        onError: (err, newOrder, context) => {
            if (context?.previousOrders) {
                context.previousOrders.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(`Failed to create order: ${err.message}`);
        },
        onSuccess: (data) => {
            toast.success('Order created successfully');
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.orders.lists(),
            });
        },
    });
}

// Delete order mutation
export function useDeleteOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => orderService.delete(id),
        onMutate: async (orderId) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.orders.lists(),
            });

            const previousOrders = queryClient.getQueriesData({
                queryKey: queryKeys.orders.lists(),
            });

            // Optimistically remove the order
            queryClient.setQueriesData(
                { queryKey: queryKeys.orders.lists() },
                (old: any) => {
                    if (!old?.data?.orders) return old;

                    return {
                        ...old,
                        data: {
                            ...old.data,
                            orders: old.data.orders.filter((order: any) => order.id !== orderId),
                        },
                    };
                }
            );

            return { previousOrders };
        },
        onError: (err, orderId, context) => {
            if (context?.previousOrders) {
                context.previousOrders.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(`Failed to delete order: ${err.message}`);
        },
        onSuccess: (data) => {
            toast.success('Order deleted successfully');
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.orders.lists(),
            });
        },
    });
}

// Export orders mutation
export function useExportOrders() {
    return useMutation({
        mutationFn: async ({ restaurantId, format, filters }: { restaurantId: string; format: 'csv' | 'json'; filters?: OrderFilters }) => {
            const blob = await orderService.export(restaurantId, format, filters);
            return { blob, format };
        },
        onSuccess: ({ blob, format }) => {
            // Create and download the file
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orders-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success(`Orders exported successfully as ${format.toUpperCase()}`);
        },
        onError: (err: Error) => {
            toast.error(`Failed to export orders: ${err.message}`);
        },
    });
}

// Custom hook for real-time order updates
export function useRealTimeOrders(restaurantId: string, filters?: Omit<OrderFilters, 'restaurantId'>) {
    const { data, isLoading, error, refetch } = useOrdersByRestaurant(restaurantId, filters);

    // Auto-refresh every 30 seconds
    const startAutoRefresh = useCallback(() => {
        const interval = setInterval(() => {
            refetch();
        }, 30000);

        return () => clearInterval(interval);
    }, [refetch]);

    return {
        orders: data?.orders || [],
        pagination: data?.pagination,
        isLoading,
        error,
        refetch,
        startAutoRefresh,
    };
} 