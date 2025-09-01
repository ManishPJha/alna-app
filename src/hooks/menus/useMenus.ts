/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/menus/useMenus.ts
import { menuService, type MenuFilters } from '@/service/menuService';
import { Menu } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Get all menus with pagination and filtering
export const useMenus = (filters?: MenuFilters) => {
    return useQuery({
        queryKey: ['menus', filters],
        queryFn: () =>
            menuService.getAll({
                ...filters,
                sortBy: filters?.sortBy || 'createdAt',
                sortOrder: filters?.sortOrder || 'desc',
            }),
        select: (data) => data.data,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

// Get single menu by ID
export const useMenu = (id: string) => {
    return useQuery({
        queryKey: ['menu', id],
        queryFn: () => menuService.getById(id),
        select: (data) => data.data,
        enabled: !!id,
    });
};

// Create new menu
export const useCreateMenu = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: menuService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menus'] });
            toast.success('Menu created successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to create menu');
        },
    });
};

// Update existing menu
export const useUpdateMenu = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Menu> }) =>
            menuService.update(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['menus'] });
            queryClient.invalidateQueries({ queryKey: ['menu', variables.id] });
            toast.success('Menu updated successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to update menu');
        },
    });
};

// Delete menu
export const useDeleteMenu = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: menuService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menus'] });
            toast.success('Menu deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to delete menu');
        },
    });
};

// Duplicate menu
export const useDuplicateMenu = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Menu> }) =>
            menuService.duplicate(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menus'] });
            toast.success('Menu duplicated successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to duplicate menu');
        },
    });
};
