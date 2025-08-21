import { Pagination, Restaurant } from '@/types/api';
import { apiClient } from './api-client';

export interface RestaurantFilters {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
}

export interface RestaurantsResponse {
    restaurants: Restaurant[];
    pagination: Pagination;
}

export const restaurantService = {
    // Get all restaurants with filtering and pagination
    getAll: (filters?: RestaurantFilters) => {
        const params = filters
            ? Object.fromEntries(
                  Object.entries(filters).map(([key, value]) => [
                      key,
                      String(value),
                  ])
              )
            : undefined;

        return apiClient.get<RestaurantsResponse>('/restaurants', params);
    },

    // Get single restaurant by ID
    getById: (id: string) => apiClient.get<Restaurant>(`/restaurants/${id}`),

    // Create new restaurant
    create: (data: Partial<Restaurant>) =>
        apiClient.post<Restaurant>('/restaurants', data),

    // Update existing restaurant
    update: (id: string, data: Partial<Restaurant>) =>
        apiClient.put<Restaurant>(`/restaurants/${id}`, data),

    // Partial update restaurant
    patch: (id: string, data: Partial<Restaurant>) =>
        apiClient.patch<Restaurant>(`/restaurants/${id}`, data),

    // Delete restaurant
    delete: (id: string) => apiClient.delete(`/restaurants/${id}`),

    // Upload menu file
    uploadMenu: (id: string, file: File) =>
        apiClient.upload<Restaurant>(`/restaurants/${id}/menu`, file),

    // Get restaurant statistics
    getStats: (id: string) =>
        apiClient.get<{
            totalManagers: number;
            totalQrCodes: number;
            totalMenuItems: number;
            monthlyVisits: number;
        }>(`/restaurants/${id}/stats`),

    // Get restaurants by manager
    getByManager: (managerId: string) =>
        apiClient.get<Restaurant[]>(`/restaurants/manager/${managerId}`),
};
