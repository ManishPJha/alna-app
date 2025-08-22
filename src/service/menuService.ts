import { Menu, Pagination } from '@/types/api';
import { apiClient } from './api-client';

export interface MenuFilters {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
    restaurantId?: string;
}

export interface MenusResponse {
    menus: Menu[];
    pagination: Pagination;
}

export const menuService = {
    // Get all menus with filtering and pagination
    getAll: (filters?: MenuFilters) => {
        const params = filters
            ? Object.fromEntries(
                  Object.entries(filters).map(([key, value]) => [
                      key,
                      String(value),
                  ])
              )
            : undefined;

        return apiClient.get<MenusResponse>('/menus', params);
    },

    // Get single menu by ID
    getById: (id: string) => apiClient.get<Menu>(`/menus/${id}`),

    // Create new menu
    create: (data: Partial<Menu>) => apiClient.post<Menu>('/menus', data),

    // Update existing menu
    update: (id: string, data: Partial<Menu>) =>
        apiClient.put<Menu>(`/menus/${id}`, data),

    // Partial update (e.g., status toggle)
    patch: (id: string, data: Partial<Menu>) =>
        apiClient.patch<Menu>(`/menus/${id}`, data),

    // Delete menu
    delete: (id: string) => apiClient.delete(`/menus/${id}`),

    // Duplicate menu
    duplicate: (id: string, data: Partial<Menu>) =>
        apiClient.post<Menu>(`/menus/${id}/duplicate`, data),

    // Get public menu (for customer view)
    getPublic: (id: string) => apiClient.get<Menu>(`/public/menus/${id}`),

    // Get menus by restaurant
    getByRestaurant: (restaurantId: string) =>
        apiClient.get<Menu[]>(`/restaurants/${restaurantId}/menus`),
};

// import { Menu } from '@/types/api';
// import { apiClient } from './api-client';

// interface MenusParams {
//     page?: number;
//     limit?: number;
//     search?: string;
//     sortBy?: string;
//     sortOrder?: 'asc' | 'desc';
//     restaurantId?: string;
// }

// interface MenusResponse {
//     menus: Menu[];
//     pagination: {
//         total: number;
//         page: number;
//         limit: number;
//         totalPages: number;
//         hasMore: boolean;
//     };
// }

// export const menuService = {
//     // Get all menus with pagination and filtering
//     async getMenus(params?: MenusParams): Promise<MenusResponse> {
//         const searchParams = new URLSearchParams();

//         if (params?.page) searchParams.append('page', params.page.toString());
//         if (params?.limit)
//             searchParams.append('limit', params.limit.toString());
//         if (params?.search) searchParams.append('search', params.search);
//         if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
//         if (params?.sortOrder)
//             searchParams.append('sortOrder', params.sortOrder);
//         if (params?.restaurantId)
//             searchParams.append('restaurantId', params.restaurantId);

//         const response = await apiClient.get<MenusResponse>(
//             `/api/menus?${searchParams.toString()}`
//         );
//         return response.data!;
//     },

//     // Get single menu by ID
//     async getMenu(id: string): Promise<Menu> {
//         const response = await apiClient.get<Menu>(`/api/menus/${id}`);
//         return response.data!;
//     },

//     // Create new menu
//     async createMenu(data: Partial<Menu>): Promise<Menu> {
//         const response = await apiClient.post<Menu>('/api/menus', data);
//         return response.data!;
//     },

//     // Update existing menu
//     async updateMenu(id: string, data: Partial<Menu>): Promise<Menu> {
//         const response = await apiClient.put(`/api/menus/${id}`, data);
//         return response.data!;
//     },

//     // Delete menu
//     async deleteMenu(id: string): Promise<void> {
//         await apiClient.delete(`/api/menus/${id}`);
//     },

//     // Duplicate menu
//     async duplicateMenu(id: string): Promise<Menu> {
//         const response = await apiClient.post(`/api/menus/${id}/duplicate`);
//         return response.data.menu;
//     },

//     // Get public menu (for customer view)
//     async getPublicMenu(id: string): Promise<Menu> {
//         const response = await apiClient.get(`/api/public/menus/${id}`);
//         return response.data.menu;
//     },

//     // Update menu status (active/inactive)
//     async updateMenuStatus(id: string, isActive: boolean): Promise<Menu> {
//         const response = await apiClient.patch(`/api/menus/${id}/status`, {
//             isActive,
//         });
//         return response.data.menu;
//     },

//     // Get menus by restaurant
//     async getMenusByRestaurant(restaurantId: string): Promise<Menu[]> {
//         const response = await apiClient.get(
//             `/api/restaurants/${restaurantId}/menus`
//         );
//         return response.data.menus;
//     },
// };
