import { queryKeys } from '@/lib/query-client';
import { UserFilters, userService } from '@/service/users';
import { User } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Get all users with filtering
export function useUsers(filters?: UserFilters) {
    return useQuery({
        queryKey: queryKeys.users.list(filters),
        queryFn: () => userService.getAll(filters),
        select: (data) => ({
            users: data.data?.users || [],
            pagination: data.data?.pagination,
        }),
        placeholderData: (previousData) => previousData,
    });
}

// Get single user
export function useUser(id: string) {
    return useQuery({
        queryKey: queryKeys.users.detail(id),
        queryFn: () => userService.getById(id),
        select: (data) => data.data,
        enabled: !!id,
    });
}

// Get current user profile
export function useUserProfile() {
    return useQuery({
        queryKey: queryKeys.users.profile(),
        queryFn: () => userService.getProfile(),
        select: (data) => data.data,
        staleTime: 10 * 60 * 1000, // Profile data is relatively stable
    });
}

// Create user mutation
export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<User> & { password?: string }) =>
            userService.create(data),
        onSuccess: () => {
            toast.success('User created successfully');
            queryClient.invalidateQueries({
                queryKey: queryKeys.users.lists(),
            });
        },
        onError: (error: Error) => {
            toast.error(`Failed to create user: ${error.message}`);
        },
    });
}

// Update user mutation
export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
            userService.update(id, data),
        onSuccess: (data, { id }) => {
            toast.success('User updated successfully');
            queryClient.invalidateQueries({
                queryKey: queryKeys.users.detail(id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.users.lists(),
            });
        },
        onError: (error: Error) => {
            toast.error(`Failed to update user: ${error.message}`);
        },
    });
}

// Delete user mutation (deactivate)
export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => userService.delete(id),
        onSuccess: () => {
            toast.success('User deactivated successfully');
            queryClient.invalidateQueries({
                queryKey: queryKeys.users.lists(),
            });
        },
        onError: (error: Error) => {
            toast.error(`Failed to deactivate user: ${error.message}`);
        },
    });
}

// Update profile mutation
export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<User>) => userService.updateProfile(data),
        onSuccess: () => {
            toast.success('Profile updated successfully');
            queryClient.invalidateQueries({
                queryKey: queryKeys.users.profile(),
            });
        },
        onError: (error: Error) => {
            toast.error(`Failed to update profile: ${error.message}`);
        },
    });
}
