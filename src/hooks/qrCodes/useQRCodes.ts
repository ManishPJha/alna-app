/* eslint-disable @typescript-eslint/no-explicit-any */
import { queryKeys } from '@/lib/query-client';
import {
    QRCodeBulkCreateData,
    QRCodeCreateData,
    QRCodeFilters,
    qrCodeService,
    QRCodeUpdateData,
} from '@/service/qrCodes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';

// Get all QR codes with caching and filtering
export function useQRCodes(filters?: QRCodeFilters) {
    return useQuery({
        queryKey: queryKeys.qrCodes.list(filters),
        queryFn: () => qrCodeService.getAll(filters),
        select: (data) => ({
            qrCodes: data.data?.qrCodes || [],
            pagination: data.data?.pagination,
        }),
        placeholderData: (previousData) => previousData,
        staleTime: 5000,
    });
}

// Get QR codes by menu ID (primary method)
export function useQRCodesByMenu(
    menuId: string,
    filters?: Omit<QRCodeFilters, 'menuId'>
) {
    return useQuery({
        queryKey: queryKeys.qrCodes.byMenu(menuId, filters),
        queryFn: () => qrCodeService.getByMenu(menuId, filters),
        select: (data) => ({
            qrCodes: data.data?.qrCodes || [],
            pagination: data.data?.pagination,
        }),
        enabled: !!menuId,
        placeholderData: (previousData) => previousData,
        refetchInterval: 10000,
        staleTime: 5000,
    });
}

// Get QR codes by restaurant (legacy support)
export function useQRCodesByRestaurant(
    restaurantId: string,
    filters?: Omit<QRCodeFilters, 'restaurantId'>
) {
    return useQuery({
        queryKey: queryKeys.qrCodes.byRestaurant(restaurantId, filters),
        queryFn: () => qrCodeService.getByRestaurant(restaurantId, filters),
        select: (data) => ({
            qrCodes: data.data?.qrCodes || [],
            pagination: data.data?.pagination,
        }),
        enabled: !!restaurantId,
        placeholderData: (previousData) => previousData,
        refetchInterval: 10000,
        staleTime: 5000,
    });
}

// Get single QR code with caching
export function useQRCode(id: string) {
    return useQuery({
        queryKey: queryKeys.qrCodes.detail(id),
        queryFn: () => qrCodeService.getById(id),
        select: (data) => data.data,
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

// Get QR code statistics
export function useQRCodeStats(
    targetId: string,
    type: 'menu' | 'restaurant' = 'restaurant',
    period?: 'today' | 'week' | 'month'
) {
    return useQuery({
        queryKey: queryKeys.qrCodes.stats(targetId, period),
        queryFn: () => qrCodeService.getStats(targetId, type, period),
        select: (data) => data.data,
        enabled: !!targetId,
        refetchInterval: 5 * 60 * 1000,
        staleTime: 2 * 60 * 1000,
    });
}

// Get QR code analytics
export function useQRCodeAnalytics(
    qrCodeId: string,
    period?: 'today' | 'week' | 'month'
) {
    return useQuery({
        queryKey: queryKeys.qrCodes.analytics(qrCodeId, period),
        queryFn: () => qrCodeService.getAnalytics(qrCodeId, period),
        select: (data) => data.data,
        enabled: !!qrCodeId,
        refetchInterval: 2 * 60 * 1000,
        staleTime: 60 * 1000,
    });
}

// Create QR code mutation
export function useCreateQRCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: QRCodeCreateData) => qrCodeService.create(data),
        onMutate: async (newQRCode) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.qrCodes.lists(),
            });

            const previousQRCodes = queryClient.getQueriesData({
                queryKey: queryKeys.qrCodes.lists(),
            });

            // Optimistically add the new QR code
            queryClient.setQueriesData(
                { queryKey: queryKeys.qrCodes.lists() },
                (old: any) => {
                    if (!old?.qrCodes) return old;

                    const optimisticQRCode = {
                        id: `temp-${Date.now()}`,
                        ...newQRCode,
                        qrToken: `temp-${Date.now()}`,
                        scanCount: 0,
                        isActive: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };

                    return {
                        ...old,
                        qrCodes: [optimisticQRCode, ...old.qrCodes],
                    };
                }
            );

            return { previousQRCodes };
        },
        onError: (err: any, newQRCode, context) => {
            if (context?.previousQRCodes) {
                context.previousQRCodes.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(`Failed to create QR code: ${err.message || err}`);
        },
        onSuccess: () => {
            toast.success('QR code created successfully');
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.qrCodes.lists(),
            });
        },
    });
}

// Update QR code mutation
export function useUpdateQRCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: QRCodeUpdateData }) =>
            qrCodeService.update(id, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.qrCodes.lists(),
            });

            const previousQRCodes = queryClient.getQueriesData({
                queryKey: queryKeys.qrCodes.lists(),
            });

            // Optimistically update all QR code lists
            queryClient.setQueriesData(
                { queryKey: queryKeys.qrCodes.lists() },
                (old: any) => {
                    if (!old?.qrCodes) return old;

                    return {
                        ...old,
                        qrCodes: old.qrCodes.map((qrCode: any) =>
                            qrCode.id === id
                                ? {
                                      ...qrCode,
                                      ...data,
                                      updatedAt: new Date().toISOString(),
                                  }
                                : qrCode
                        ),
                    };
                }
            );

            return { previousQRCodes };
        },
        onError: (err: any, { id }, context) => {
            if (context?.previousQRCodes) {
                context.previousQRCodes.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(`Failed to update QR code: ${err.message || err}`);
        },
        onSuccess: () => {
            toast.success('QR code updated successfully');
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.qrCodes.lists(),
            });
        },
    });
}

// Delete QR code mutation
export function useDeleteQRCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => qrCodeService.delete(id),
        onMutate: async (qrCodeId) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.qrCodes.lists(),
            });

            const previousQRCodes = queryClient.getQueriesData({
                queryKey: queryKeys.qrCodes.lists(),
            });

            // Optimistically remove the QR code
            queryClient.setQueriesData(
                { queryKey: queryKeys.qrCodes.lists() },
                (old: any) => {
                    if (!old?.qrCodes) return old;

                    return {
                        ...old,
                        qrCodes: old.qrCodes.filter(
                            (qrCode: any) => qrCode.id !== qrCodeId
                        ),
                    };
                }
            );

            return { previousQRCodes };
        },
        onError: (err: any, qrCodeId, context) => {
            if (context?.previousQRCodes) {
                context.previousQRCodes.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(`Failed to delete QR code: ${err.message || err}`);
        },
        onSuccess: () => {
            toast.success('QR code deleted successfully');
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.qrCodes.lists(),
            });
        },
    });
}

// Bulk create QR codes mutation
export function useBulkCreateQRCodes() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: QRCodeBulkCreateData) =>
            qrCodeService.bulkCreate(data),
        onMutate: async (bulkData) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.qrCodes.lists(),
            });

            const previousQRCodes = queryClient.getQueriesData({
                queryKey: queryKeys.qrCodes.lists(),
            });

            // Optimistically add the new QR codes
            queryClient.setQueriesData(
                { queryKey: queryKeys.qrCodes.lists() },
                (old: any) => {
                    if (!old?.qrCodes) return old;

                    const startNumber = bulkData.startNumber || 1;
                    const optimisticQRCodes = Array.from(
                        { length: bulkData.totalTables },
                        (_, i) => ({
                            id: `temp-${Date.now()}-${i}`,
                            menuId: bulkData.menuId,
                            restaurantId: bulkData.restaurantId,
                            tableNumber: String(startNumber + i),
                            qrToken: `temp-${Date.now()}-${i}`,
                            scanCount: 0,
                            isActive: true,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        })
                    );

                    return {
                        ...old,
                        qrCodes: [...optimisticQRCodes, ...old.qrCodes],
                    };
                }
            );

            return { previousQRCodes };
        },
        onError: (err: any, bulkData, context) => {
            if (context?.previousQRCodes) {
                context.previousQRCodes.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(`Failed to create QR codes: ${err.message || err}`);
        },
        onSuccess: (data) => {
            const message = data.data?.created
                ? `Successfully created ${data.data.created} QR codes`
                : 'QR codes processed successfully';
            toast.success(message);
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.qrCodes.lists(),
            });
        },
    });
}

// Toggle QR code active status mutation
export function useToggleQRCodeActive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            qrCodeService.toggleActive(id, isActive),
        onMutate: async ({ id, isActive }) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.qrCodes.lists(),
            });

            const previousQRCodes = queryClient.getQueriesData({
                queryKey: queryKeys.qrCodes.lists(),
            });

            // Optimistically update all QR code lists
            queryClient.setQueriesData(
                { queryKey: queryKeys.qrCodes.lists() },
                (old: any) => {
                    if (!old?.qrCodes) return old;

                    return {
                        ...old,
                        qrCodes: old.qrCodes.map((qrCode: any) =>
                            qrCode.id === id
                                ? {
                                      ...qrCode,
                                      isActive,
                                      updatedAt: new Date().toISOString(),
                                  }
                                : qrCode
                        ),
                    };
                }
            );

            return { previousQRCodes };
        },
        onError: (err: any, { id }, context) => {
            if (context?.previousQRCodes) {
                context.previousQRCodes.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(
                `Failed to update QR code status: ${err.message || err}`
            );
        },
        onSuccess: (data, { isActive }) => {
            toast.success(
                `QR code ${isActive ? 'activated' : 'deactivated'} successfully`
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.qrCodes.lists(),
            });
        },
    });
}

// Export QR codes mutation
export function useExportQRCodes() {
    return useMutation({
        mutationFn: ({
            targetId,
            type = 'restaurant',
            format,
            filters,
        }: {
            targetId: string;
            type?: 'restaurant' | 'menu';
            format: 'csv' | 'json';
            filters?: QRCodeFilters;
        }) => qrCodeService.export(targetId, type, format, filters),
        onSuccess: (data, { format }) => {
            toast.success(
                `QR codes exported successfully as ${format.toUpperCase()}`
            );
        },
        onError: (err: any) => {
            toast.error(`Failed to export QR codes: ${err.message || err}`);
        },
    });
}

// Regenerate QR token mutation
export function useRegenerateQRToken() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => qrCodeService.regenerateToken(id),
        onMutate: async (qrCodeId) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.qrCodes.lists(),
            });

            const previousQRCodes = queryClient.getQueriesData({
                queryKey: queryKeys.qrCodes.lists(),
            });

            // Optimistically update with temporary token
            queryClient.setQueriesData(
                { queryKey: queryKeys.qrCodes.lists() },
                (old: any) => {
                    if (!old?.qrCodes) return old;

                    return {
                        ...old,
                        qrCodes: old.qrCodes.map((qrCode: any) =>
                            qrCode.id === qrCodeId
                                ? {
                                      ...qrCode,
                                      qrToken: `regenerating-${Date.now()}`,
                                      updatedAt: new Date().toISOString(),
                                  }
                                : qrCode
                        ),
                    };
                }
            );

            return { previousQRCodes };
        },
        onError: (err: any, qrCodeId, context) => {
            if (context?.previousQRCodes) {
                context.previousQRCodes.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(`Failed to regenerate QR token: ${err.message || err}`);
        },
        onSuccess: () => {
            toast.success('QR token regenerated successfully');
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.qrCodes.lists(),
            });
        },
    });
}

// Custom hook for real-time QR code updates with menu support
export function useRealTimeQRCodes(
    menuId?: string,
    restaurantId?: string,
    filters?: Omit<QRCodeFilters, 'menuId' | 'restaurantId'>
) {
    const menuQuery = useQRCodesByMenu(menuId!, filters);
    const restaurantQuery = useQRCodesByRestaurant(restaurantId!, filters);

    // Use menu query if menuId is provided, otherwise fall back to restaurant query
    const activeQuery = menuId ? menuQuery : restaurantQuery;

    // Auto-refresh every 10 seconds
    const startAutoRefresh = useCallback(() => {
        const interval = setInterval(() => {
            activeQuery.refetch();
        }, 10000);

        return () => clearInterval(interval);
    }, [activeQuery]);

    return {
        qrCodes: activeQuery.data?.qrCodes || [],
        pagination: activeQuery.data?.pagination,
        isLoading: activeQuery.isLoading,
        error: activeQuery.error,
        refetch: activeQuery.refetch,
        startAutoRefresh,
    };
}
