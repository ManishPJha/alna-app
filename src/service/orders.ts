import { Pagination } from '@/types/api';
import { apiClient } from './api-client';

export interface Order {
    id: string;
    restaurantId: string;
    sessionId?: string;
    qrCodeId?: string;
    customerLanguage: string;
    originalLanguage: string;
    totalAmount: number;
    specialRequests?: string;
    translatedSpecialRequests?: string;
    status: OrderStatus;
    submittedAt?: string;
    createdAt: string;
    updatedAt: string;
    qrCode?: {
        id: string;
        tableNumber?: string;
        name?: string;
    };
    orderItems?: OrderItem[];
}

export interface OrderItem {
    id: string;
    orderId: string;
    menuItemId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specialInstructions?: string;
    translatedInstructions?: string;
    createdAt: string;
    menuItem?: {
        id: string;
        name: string;
    };
    customizations?: OrderItemCustomization[];
}

export interface OrderItemCustomization {
    id: string;
    orderItemId: string;
    customizationOptionId: string;
    priceModifier: number;
    createdAt: string;
    customizationOption?: {
        id: string;
        name: string;
        price: number;
    };
}

export type OrderStatus =
    | 'DRAFT'
    | 'RECEIVED'
    | 'PREPARING'
    | 'READY'
    | 'SERVED'
    | 'CANCELLED';

export interface OrderFilters {
    restaurantId?: string;
    status?: OrderStatus;
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'createdAt' | 'totalAmount' | 'status';
    sortOrder?: 'asc' | 'desc';
    startDate?: string;
    endDate?: string;
}

export interface OrdersResponse {
    orders: Order[];
    pagination: Pagination;
}

export interface OrderStats {
    totalOrders: number;
    ordersByStatus: Record<OrderStatus, number>;
    totalRevenue: number;
    averageOrderValue: number;
    recentOrders: Order[];
    topMenuItems: Array<{
        name: string;
        count: number;
        revenue: number;
    }>;
    hourlyDistribution: number[];
    period: string;
    dateRange: {
        start: string;
        end: string;
    };
}

export const orderService = {
    // Get all orders with filtering and pagination
    getAll: (filters?: OrderFilters) => {
        const params = filters
            ? Object.fromEntries(
                  Object.entries(filters)
                      .filter(
                          ([, value]) => value !== undefined && value !== null
                      )
                      .map(([key, value]) => [key, String(value)])
              )
            : undefined;

        return apiClient.get<OrdersResponse>('/orders', params);
    },

    // Get single order by ID
    getById: (id: string) => apiClient.get<Order>(`/orders/${id}`),

    // Get orders by restaurant
    getByRestaurant: (
        restaurantId: string,
        filters?: Omit<OrderFilters, 'restaurantId'>
    ) => {
        const params = {
            restaurantId,
            ...(filters &&
                Object.fromEntries(
                    Object.entries(filters)
                        .filter(
                            ([, value]) => value !== undefined && value !== null
                        )
                        .map(([key, value]) => [key, String(value)])
                )),
        } as Record<string, string>;

        return apiClient.get<OrdersResponse>('/orders', params);
    },

    // Update order status
    updateStatus: (orderId: string, status: OrderStatus) =>
        apiClient.patch<Order>('/orders', { orderId, status }),

    // Create new order (for testing/admin purposes)
    create: (data: Partial<Order>) => apiClient.post<Order>('/orders', data),

    // Delete order (for admin purposes)
    delete: (id: string) => apiClient.delete(`/orders/${id}`),

    // Get order statistics
    getStats: (restaurantId: string, period?: 'today' | 'week' | 'month') => {
        const params = { restaurantId, ...(period && { period }) };
        return apiClient.get<OrderStats>('/orders/stats', params);
    },

    // Get orders by status
    getByStatus: (restaurantId: string, status: OrderStatus) =>
        apiClient.get<Order[]>(`/orders`, { restaurantId, status }),

    // Bulk update order statuses
    bulkUpdateStatus: (orderIds: string[], status: OrderStatus) =>
        apiClient.patch<{ updated: number }>('/orders/bulk', {
            orderIds,
            status,
        }),

    // Export orders (for reporting)
    export: (
        restaurantId: string,
        format: 'csv' | 'json',
        filters?: OrderFilters
    ) => {
        const params: Record<string, string> = {};
        params.restaurantId = restaurantId;
        params.format = format;

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) {
                    params[key] = String(value);
                }
            });
        }

        return apiClient.getBlob('/orders/export', params);
    },
};
