import { Pagination } from '@/types/api';
import { apiClient } from './api-client';

export interface QRCode {
    id: string;
    restaurantId: string;
    menuId?: string; // NEW: Optional menu association
    tableNumber?: string;
    qrToken: string;
    qrImageUrl?: string;
    isActive: boolean;
    scanCount: number;
    lastScanned?: string;
    createdAt: string;
    updatedAt: string;
    restaurant?: {
        id: string;
        name: string;
    };
    menu?: {
        id: string;
        name: string;
        restaurant: {
            id: string;
            name: string;
        };
    };
    // Analytics data
    analytics?: {
        totalScans: number;
        uniqueVisitors: number;
        averageSessionDuration: number;
        popularLanguages: Array<{ language: string; count: number }>;
        recentActivity: Array<{ timestamp: string; event: string }>;
    };
}

export interface QRCodeFilters {
    restaurantId?: string;
    menuId?: string; // NEW: Filter by menu
    isActive?: boolean;
    tableNumber?: string;
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'createdAt' | 'scanCount' | 'tableNumber' | 'lastScanned';
    sortOrder?: 'asc' | 'desc';
    startDate?: string;
    endDate?: string;
}

export interface QRCodeCreateData {
    restaurantId?: string; // Keep for backward compatibility
    menuId?: string; // NEW: Primary association method
    tableNumber?: string;
    name?: string;
    isActive?: boolean;
}

export interface QRCodeUpdateData {
    tableNumber?: string;
    name?: string;
    isActive?: boolean;
    menuId?: string; // Allow updating menu association
}

export interface QRCodeBulkCreateData {
    restaurantId?: string; // Keep for backward compatibility
    menuId?: string; // NEW: Primary association method
    totalTables: number;
    prefix?: string;
    startNumber?: number;
}

export interface QRCodeStats {
    totalQRCodes: number;
    activeQRCodes: number;
    totalScans: number;
    uniqueVisitors: number;
    averageScansPerCode: number;
    mostScannedCode?: QRCode;
    recentActivity: Array<{
        qrCodeId: string;
        tableNumber?: string;
        event: string;
        timestamp: string;
    }>;
    scansByDate: Array<{ date: string; scans: number }>;
    topQRCodes: Array<QRCode & { scanCount: number }>;
    popularLanguages: Array<{
        language: string;
        count: number;
    }>;
    hourlyDistribution: number[];
    period: string;
    dateRange: {
        start: string;
        end: string;
    };
}

export interface QRCodeResponse {
    qrCodes: QRCode[];
    pagination: Pagination;
}

export const qrCodeService = {
    // Get all QR codes with filtering and pagination
    getAll: (filters?: QRCodeFilters) => {
        const params = filters
            ? Object.fromEntries(
                  Object.entries(filters).map(([key, value]) => [
                      key,
                      String(value),
                  ])
              )
            : undefined;

        return apiClient.get<QRCodeResponse>('/qrcodes', params);
    },

    // Get single QR code by ID
    getById: (id: string) => apiClient.get<QRCode>(`/qrcodes/${id}`),

    // Get QR codes by restaurant (legacy method)
    getByRestaurant: (
        restaurantId: string,
        filters?: Omit<QRCodeFilters, 'restaurantId'>
    ) => {
        const params = {
            restaurantId,
            ...(filters &&
                Object.fromEntries(
                    Object.entries(filters).map(([key, value]) => [
                        key,
                        String(value),
                    ])
                )),
        };

        return apiClient.get<QRCodeResponse>('/qrcodes', params);
    },

    // Get QR codes by menu (NEW primary method)
    getByMenu: (menuId: string, filters?: Omit<QRCodeFilters, 'menuId'>) => {
        const params = {
            menuId,
            ...(filters &&
                Object.fromEntries(
                    Object.entries(filters).map(([key, value]) => [
                        key,
                        String(value),
                    ])
                )),
        };

        return apiClient.get<QRCodeResponse>('/qrcodes', params);
    },

    // Create new QR code
    create: (data: QRCodeCreateData) =>
        apiClient.post<QRCode>('/qrcodes', data),

    // Update existing QR code
    update: (id: string, data: QRCodeUpdateData) =>
        apiClient.patch<QRCode>(`/qrcodes/${id}`, data),

    // Delete QR code
    delete: (id: string) => apiClient.delete(`/qrcodes/${id}`),

    // Bulk create QR codes
    bulkCreate: (data: QRCodeBulkCreateData) =>
        apiClient.post<{ created: number; qrCodes: QRCode[] }>(
            '/qrcodes/bulk',
            data
        ),

    // Toggle QR code active status
    toggleActive: (id: string, isActive: boolean) =>
        apiClient.patch<QRCode>(`/qrcodes/${id}`, { isActive }),

    // Get QR code statistics (supports both restaurant and menu)
    getStats: (
        targetId: string,
        type: 'restaurant' | 'menu' = 'restaurant',
        period?: 'today' | 'week' | 'month'
    ) => {
        const paramKey = type === 'menu' ? 'menuId' : 'restaurantId';
        const params = { [paramKey]: targetId, ...(period && { period }) };
        return apiClient.get<QRCodeStats>('/qrcodes/stats', params);
    },

    // Get QR code analytics
    getAnalytics: (qrCodeId: string, period?: 'today' | 'week' | 'month') => {
        const params = period ? { period } : undefined;
        return apiClient.get<QRCode['analytics']>(
            `/qrcodes/${qrCodeId}/analytics`,
            params
        );
    },

    // Generate QR code image
    generateImage: (
        qrCodeId: string,
        options?: {
            size?: number;
            format?: 'png' | 'svg' | 'pdf';
            includeLogo?: boolean;
        }
    ) => {
        const params = options
            ? Object.fromEntries(
                  Object.entries(options).map(([key, value]) => [
                      key,
                      String(value),
                  ])
              )
            : undefined;

        return apiClient.getBlob(`/qrcodes/${qrCodeId}/image`, params);
    },

    // Export QR codes (supports both restaurant and menu)
    export: (
        targetId: string,
        type: 'restaurant' | 'menu' = 'restaurant',
        format: 'csv' | 'json',
        filters?: QRCodeFilters
    ) => {
        const paramKey = type === 'menu' ? 'menuId' : 'restaurantId';
        const params = {
            [paramKey]: targetId,
            format,
            ...(filters &&
                Object.fromEntries(
                    Object.entries(filters).map(([key, value]) => [
                        key,
                        String(value),
                    ])
                )),
        };

        return apiClient.getBlob(`/qrcodes/export`, params);
    },

    // Get QR code usage report
    getUsageReport: (
        targetId: string,
        type: 'restaurant' | 'menu' = 'restaurant',
        period?: 'today' | 'week' | 'month'
    ) => {
        const paramKey = type === 'menu' ? 'menuId' : 'restaurantId';
        const params = { [paramKey]: targetId, ...(period && { period }) };
        return apiClient.get<{
            totalScans: number;
            uniqueVisitors: number;
            averageSessionDuration: number;
            popularLanguages: Array<{ language: string; count: number }>;
            scansByHour: Array<{ hour: number; scans: number }>;
            topQRCodes: Array<{ qrCode: QRCode; scans: number }>;
        }>(`/qrcodes/usage-report`, params);
    },

    // Regenerate QR token
    regenerateToken: (id: string) =>
        apiClient.post<QRCode>(`/qrcodes/${id}/regenerate-token`, {}),

    // Duplicate QR code
    duplicate: (id: string, data?: { tableNumber?: string; name?: string }) =>
        apiClient.post<QRCode>(`/qrcodes/${id}/duplicate`, data),

    // Get QR code by token (for public access)
    getByToken: (token: string) => apiClient.get<QRCode>(`/public/qr/${token}`),

    // Record QR code scan (for analytics)
    recordScan: (
        token: string,
        data?: {
            userAgent?: string;
            ipAddress?: string;
            language?: string;
            referrer?: string;
        }
    ) => apiClient.post(`/public/qr/${token}/scan`, data),
};
