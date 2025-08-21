import { Pagination, User } from '@/types/api';
import { apiClient } from './api-client';

export interface UserFilters {
    search?: string;
    role?: 'USER' | 'MANAGER' | 'ADMIN';
    restaurantId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}

export interface UsersResponse {
    users: User[];
    pagination: Pagination;
}

export const userService = {
    // Get all users with filtering
    getAll: (filters?: UserFilters) => {
        const params = filters
            ? Object.fromEntries(
                  Object.entries(filters).map(([key, value]) => [
                      key,
                      String(value),
                  ])
              )
            : undefined;

        return apiClient.get<UsersResponse>('/users', params);
    },

    // Get single user by ID
    getById: (id: string) => apiClient.get<User>(`/users/${id}`),

    // Create new user
    create: (data: Partial<User> & { password?: string }) =>
        apiClient.post<User>('/users', data),

    // Update user
    update: (id: string, data: Partial<User>) =>
        apiClient.put<User>(`/users/${id}`, data),

    // Delete user (sets isActive to false)
    delete: (id: string) => apiClient.delete(`/users/${id}`),

    // Restore user (sets isActive to true)
    restore: (id: string) => apiClient.patch<User>(`/users/${id}/restore`, {}),

    // Change user password
    changePassword: (id: string, oldPassword: string, newPassword: string) =>
        apiClient.post(`/users/${id}/change-password`, {
            oldPassword,
            newPassword,
        }),

    // Get current user profile
    getProfile: () => apiClient.get<User>('/users/profile'),

    // Update current user profile
    updateProfile: (data: Partial<User>) =>
        apiClient.put<User>('/users/profile', data),
};
