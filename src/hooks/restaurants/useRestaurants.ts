/* eslint-disable @typescript-eslint/no-explicit-any */
import { queryKeys } from '@/lib/query-client';
import { RestaurantFilters, restaurantService } from '@/service/restaurants';
import { Restaurant } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';

// Get all restaurants with caching and filtering
export function useRestaurants(filters?: RestaurantFilters) {
    return useQuery({
        queryKey: queryKeys.restaurants.list(filters),
        queryFn: () =>
            restaurantService.getAll({
                ...filters,
                sortBy: filters?.sortBy || 'createdAt',
                sortOrder: filters?.sortOrder || 'desc',
            }),
        select: (data) => ({
            restaurants: data.data?.restaurants || [],
            pagination: data.data?.pagination,
        }),
        placeholderData: (previousData) => previousData,
    });
}

// Get single restaurant with caching
export function useRestaurant(id: string) {
    return useQuery({
        queryKey: queryKeys.restaurants.detail(id),
        queryFn: () => restaurantService.getById(id),
        select: (data) => data.data,
        enabled: !!id, // Only run query if ID exists
        staleTime: 10 * 60 * 1000, // Restaurant details are more stable
    });
}

// Get restaurant statistics
export function useRestaurantStats(id: string) {
    return useQuery({
        queryKey: queryKeys.restaurants.stats(id),
        queryFn: () => restaurantService.getStats(id),
        select: (data) => data.data,
        enabled: !!id,
        refetchInterval: 5 * 60 * 1000, // Refresh stats every 5 minutes
    });
}

// Create restaurant mutation
export function useCreateRestaurant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Restaurant>) =>
            restaurantService.create(data),
        onMutate: async (newRestaurant) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({
                queryKey: queryKeys.restaurants.lists(),
            });

            // Snapshot previous value
            const previousRestaurants = queryClient.getQueryData(
                queryKeys.restaurants.lists()
            );

            // Optimistically update
            queryClient.setQueriesData(
                { queryKey: queryKeys.restaurants.lists() },
                (old: any) => {
                    if (!old?.data?.restaurants) return old;

                    const optimisticRestaurant = {
                        id: `temp-${Date.now()}`,
                        ...newRestaurant,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };

                    return {
                        ...old,
                        data: {
                            ...old.data,
                            restaurants: [
                                optimisticRestaurant,
                                ...old.data.restaurants,
                            ],
                        },
                    };
                }
            );

            return { previousRestaurants };
        },
        onError: (err, newRestaurant, context) => {
            // Rollback on error
            queryClient.setQueryData(
                queryKeys.restaurants.lists(),
                context?.previousRestaurants
            );
            toast.error(`Failed to create restaurant: ${err.message}`);
        },
        onSuccess: (data) => {
            toast.success('Restaurant created successfully');
        },
        onSettled: () => {
            // Always refetch after success or error
            queryClient.invalidateQueries({
                queryKey: queryKeys.restaurants.lists(),
            });
        },
    });
}

// Update restaurant mutation
export function useUpdateRestaurant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Restaurant> }) =>
            restaurantService.update(id, data),
        onMutate: async ({ id, data: updateData }) => {
            // Cancel queries
            await queryClient.cancelQueries({
                queryKey: queryKeys.restaurants.detail(id),
            });
            await queryClient.cancelQueries({
                queryKey: queryKeys.restaurants.lists(),
            });

            // Snapshot previous values
            const previousRestaurant = queryClient.getQueryData(
                queryKeys.restaurants.detail(id)
            );
            const previousRestaurants = queryClient.getQueryData(
                queryKeys.restaurants.lists()
            );

            // Optimistically update single restaurant
            queryClient.setQueryData(
                queryKeys.restaurants.detail(id),
                (old: any) => ({
                    ...old,
                    data: { ...old?.data, ...updateData },
                })
            );

            // Optimistically update in lists
            queryClient.setQueriesData(
                { queryKey: queryKeys.restaurants.lists() },
                (old: any) => {
                    if (!old?.data?.restaurants) return old;

                    return {
                        ...old,
                        data: {
                            ...old.data,
                            restaurants: old.data.restaurants.map(
                                (restaurant: Restaurant) =>
                                    restaurant.id === id
                                        ? { ...restaurant, ...updateData }
                                        : restaurant
                            ),
                        },
                    };
                }
            );

            return { previousRestaurant, previousRestaurants };
        },
        onError: (err, { id }, context) => {
            // Rollback
            if (context?.previousRestaurant) {
                queryClient.setQueryData(
                    queryKeys.restaurants.detail(id),
                    context.previousRestaurant
                );
            }
            if (context?.previousRestaurants) {
                queryClient.setQueryData(
                    queryKeys.restaurants.lists(),
                    context.previousRestaurants
                );
            }
            toast.error(`Failed to update restaurant: ${err.message}`);
        },
        onSuccess: () => {
            toast.success('Restaurant updated successfully');
        },
        onSettled: (data, error, { id }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.restaurants.detail(id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.restaurants.lists(),
            });
        },
    });
}

// Delete restaurant mutation
export function useDeleteRestaurant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => restaurantService.delete(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.restaurants.lists(),
            });

            const previousRestaurants = queryClient.getQueryData(
                queryKeys.restaurants.lists()
            );

            // Optimistically remove from lists
            queryClient.setQueriesData(
                { queryKey: queryKeys.restaurants.lists() },
                (old: any) => {
                    if (!old?.data?.restaurants) return old;

                    return {
                        ...old,
                        data: {
                            ...old.data,
                            restaurants: old.data.restaurants.filter(
                                (r: Restaurant) => r.id !== id
                            ),
                        },
                    };
                }
            );

            return { previousRestaurants };
        },
        onError: (err, id, context) => {
            if (context?.previousRestaurants) {
                queryClient.setQueryData(
                    queryKeys.restaurants.lists(),
                    context.previousRestaurants
                );
            }
            toast.error(`Failed to delete restaurant: ${err.message}`);
        },
        onSuccess: () => {
            toast.success('Restaurant deleted successfully');
        },
        onSettled: (data, error, id) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.restaurants.lists(),
            });
            queryClient.removeQueries({
                queryKey: queryKeys.restaurants.detail(id),
            });
        },
    });
}

// Upload menu mutation
export function useUploadMenu() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, file }: { id: string; file: File }) =>
            restaurantService.uploadMenu(id, file),
        onSuccess: (data, { id }) => {
            toast.success('Menu uploaded successfully');
            // Invalidate restaurant data to refresh menu info
            queryClient.invalidateQueries({
                queryKey: queryKeys.restaurants.detail(id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.restaurants.lists(),
            });
        },
        onError: (error) => {
            toast.error(`Failed to upload menu: ${error.message}`);
        },
    });
}

// Custom hook for restaurant operations
export function useRestaurantOperations() {
    const createMutation = useCreateRestaurant();
    const updateMutation = useUpdateRestaurant();
    const deleteMutation = useDeleteRestaurant();
    const uploadMenuMutation = useUploadMenu();

    const createRestaurant = useCallback(
        (data: Partial<Restaurant>) => createMutation.mutateAsync(data),
        [createMutation]
    );

    const updateRestaurant = useCallback(
        (id: string, data: Partial<Restaurant>) =>
            updateMutation.mutateAsync({ id, data }),
        [updateMutation]
    );

    const deleteRestaurant = useCallback(
        (id: string) => deleteMutation.mutateAsync(id),
        [deleteMutation]
    );

    const uploadMenu = useCallback(
        (id: string, file: File) =>
            uploadMenuMutation.mutateAsync({ id, file }),
        [uploadMenuMutation]
    );

    return {
        createRestaurant,
        updateRestaurant,
        deleteRestaurant,
        uploadMenu,
        isLoading:
            createMutation.isPending ||
            updateMutation.isPending ||
            deleteMutation.isPending ||
            uploadMenuMutation.isPending,
    };
}
