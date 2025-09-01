import { Menu } from '@/types/api';
import { MenuFormData } from '@/types/menu';
import { apiClient } from './api-client';

export interface MenuFilters {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'name' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
    restaurantId?: string;
}

export interface MenuResponse {
    data: {
        menus: Menu[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasMore: boolean;
        };
    };
    success: boolean;
}

export interface SingleMenuResponse {
    data: Menu;
    success: boolean;
}

export interface CreateMenuResponse {
    data: Menu;
    success: boolean;
    message: string;
}

class MenuService {
    async getAll(filters: MenuFilters = {}): Promise<MenuResponse> {
        const params = filters
            ? Object.fromEntries(
                  Object.entries(filters).map(([key, value]) => [
                      key,
                      String(value),
                  ])
              )
            : undefined;

        const response = await apiClient.get<MenuResponse>('/menus', params);

        if (!response.success) {
            throw new Error(response.error || 'Failed to fetch menus');
        }

        return response.data!;
    }

    async getById(id: string): Promise<SingleMenuResponse> {
        const response = await apiClient.get<SingleMenuResponse>(
            `/menus/${id}`
        );

        if (!response.success) {
            throw new Error(response.error || 'Failed to fetch menu');
        }

        return response.data!;
    }

    async create(data: MenuFormData): Promise<CreateMenuResponse> {
        const response = await apiClient.post<CreateMenuResponse>(
            '/menus',
            data
        );

        if (!response.success) {
            throw new Error(response.error || 'Failed to create menu');
        }

        return response.data!;
    }

    async update(
        id: string,
        data: Partial<MenuFormData>
    ): Promise<CreateMenuResponse> {
        const response = await apiClient.put<CreateMenuResponse>(
            `/menus/${id}`,
            data
        );

        if (!response.success) {
            throw new Error(response.error || 'Failed to update menu');
        }

        return response.data!;
    }

    async delete(id: string): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.delete<{
            success: boolean;
            message: string;
        }>(`/menus/${id}`);

        if (!response.success) {
            throw new Error(response.error || 'Failed to delete menu');
        }

        return response.data!;
    }

    async duplicate(
        id: string,
        data: { name?: string; description?: string; restaurantId?: string }
    ): Promise<CreateMenuResponse> {
        const response = await apiClient.post<CreateMenuResponse>(
            `/menus/${id}/duplicate`,
            data
        );

        if (!response.success) {
            throw new Error(response.error || 'Failed to duplicate menu');
        }

        return response.data!;
    }

    async getPublicMenu(id: string): Promise<MenuFormData> {
        const response = await apiClient.get<MenuFormData>(
            `/public/menus/${id}`
        );

        if (!response.success) {
            throw new Error(response.error || 'Failed to fetch public menu');
        }

        return response.data!;
    }

    // Additional utility methods

    async updateStatus(
        id: string,
        isActive: boolean
    ): Promise<CreateMenuResponse> {
        const response = await apiClient.patch<CreateMenuResponse>(
            `/menus/${id}`,
            { isActive }
        );

        if (!response.success) {
            throw new Error(response.error || 'Failed to update menu status');
        }

        return response.data!;
    }

    async publish(
        id: string,
        isPublished: boolean
    ): Promise<CreateMenuResponse> {
        const response = await apiClient.patch<CreateMenuResponse>(
            `/menus/${id}`,
            { isPublished }
        );

        if (!response.success) {
            throw new Error(
                response.error || 'Failed to update menu publication status'
            );
        }

        return response.data!;
    }

    async getByRestaurant(restaurantId: string): Promise<Menu[]> {
        const response = await apiClient.get<{ menus: Menu[] }>(
            `/restaurants/${restaurantId}/menus`
        );

        if (!response.success) {
            throw new Error(
                response.error || 'Failed to fetch restaurant menus'
            );
        }

        return response.data!.menus;
    }
}

export const menuService = new MenuService();
