import { RestaurantModel } from '@/models/RestaurantModel';
import { Restaurant } from '@/types/api';

export class RestaurantController {
    private static instance: RestaurantController;
    private restaurants: Restaurant[] = [];
    private loading = false;
    private error: string | null = null;

    static getInstance(): RestaurantController {
        if (!RestaurantController.instance) {
            RestaurantController.instance = new RestaurantController();
        }
        return RestaurantController.instance;
    }

    // State getters
    getRestaurants(): Restaurant[] {
        return this.restaurants;
    }

    isLoading(): boolean {
        return this.loading;
    }

    getError(): string | null {
        return this.error;
    }

    // CRUD operations
    async loadRestaurants(): Promise<boolean> {
        this.loading = true;
        this.error = null;

        const result = await RestaurantModel.getAll();
        console.log(
            '🚀 ~ RestaurantController ~ loadRestaurants ~ result:',
            result
        );

        if (result.success && result.data) {
            this.restaurants = result.data.restaurants;
            this.loading = false;
            return true;
        } else {
            this.error = result.error || 'Failed to load restaurants';
            this.loading = false;
            return false;
        }
    }

    async createRestaurant(data: Partial<Restaurant>): Promise<boolean> {
        this.loading = true;
        this.error = null;

        const result = await RestaurantModel.create(data);

        if (result.success && result.data) {
            this.restaurants.push(result.data);
            this.loading = false;
            return true;
        } else {
            this.error = result.error || 'Failed to create restaurant';
            this.loading = false;
            return false;
        }
    }

    async updateRestaurant(
        id: string,
        data: Partial<Restaurant>
    ): Promise<boolean> {
        this.loading = true;
        this.error = null;

        const result = await RestaurantModel.update(id, data);

        if (result.success && result.data) {
            const index = this.restaurants.findIndex((r) => r.id === id);
            if (index !== -1) {
                this.restaurants[index] = result.data;
            }
            this.loading = false;
            return true;
        } else {
            this.error = result.error || 'Failed to update restaurant';
            this.loading = false;
            return false;
        }
    }

    async deleteRestaurant(id: string): Promise<boolean> {
        this.loading = true;
        this.error = null;

        const result = await RestaurantModel.delete(id);

        if (result.success) {
            this.restaurants = this.restaurants.filter((r) => r.id !== id);
            this.loading = false;
            return true;
        } else {
            this.error = result.error || 'Failed to delete restaurant';
            this.loading = false;
            return false;
        }
    }

    async uploadMenu(id: string, menuFile: File): Promise<boolean> {
        this.loading = true;
        this.error = null;

        const result = await RestaurantModel.uploadMenu(id, menuFile);

        if (result.success && result.data) {
            const index = this.restaurants.findIndex((r) => r.id === id);
            if (index !== -1) {
                this.restaurants[index] = result.data;
            }
            this.loading = false;
            return true;
        } else {
            this.error = result.error || 'Failed to upload menu';
            this.loading = false;
            return false;
        }
    }
}
