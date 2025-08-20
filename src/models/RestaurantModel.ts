import { clientApiService } from '@/service/clientApiService';
import { ApiResponse, Pagination, Restaurant, User } from '@/types/api';

type RestaurantListResponse = {
    restaurants: Restaurant[];
    pagination: Pagination;
};

export class RestaurantModel {
    static async getAll(): Promise<ApiResponse<RestaurantListResponse>> {
        return clientApiService.get<RestaurantListResponse>('/restaurants');
    }

    static async getById(id: string): Promise<ApiResponse<Restaurant>> {
        return clientApiService.getById<Restaurant>('/restaurants', id);
    }

    static async create(
        data: Partial<Restaurant>
    ): Promise<ApiResponse<Restaurant>> {
        return clientApiService.create<Restaurant>('/restaurants', data);
    }

    static async update(
        id: string,
        data: Partial<Restaurant>
    ): Promise<ApiResponse<Restaurant>> {
        return clientApiService.update<Restaurant>('/restaurants', id, data);
    }

    static async delete(id: string): Promise<ApiResponse<void>> {
        return clientApiService.delete('/restaurants', id);
    }

    static async uploadMenu(
        id: string,
        menuFile: File
    ): Promise<ApiResponse<Restaurant>> {
        const formData = new FormData();
        formData.append('menu', menuFile);

        try {
            const response = await fetch(`/api/restaurants/${id}/menu`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || `HTTP ${response.status}`,
                };
            }

            return {
                success: true,
                data,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    // Get managers for a restaurant
    static async getRestaurantManagers(
        restaurantId: string
    ): Promise<ApiResponse<User[]>> {
        return clientApiService.get<User[]>(
            `/restaurants/${restaurantId}/managers`
        );
    }

    // Assign a user as manager to a restaurant
    static async assignManager(
        restaurantId: string,
        userId: string
    ): Promise<ApiResponse<User>> {
        return clientApiService.create<User>(
            `/restaurants/${restaurantId}/managers`,
            { id: userId }
        );
    }

    // Remove manager from restaurant
    static async removeManager(
        restaurantId: string,
        userId: string
    ): Promise<ApiResponse<void>> {
        return clientApiService.delete(
            `/restaurants/${restaurantId}/managers`,
            userId
        );
    }
}
