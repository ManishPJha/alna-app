import { RestaurantController } from '@/controller/RestaurantController';
import { Restaurant } from '@/types/api';
import { useEffect, useState } from 'react';

export function useRestaurants() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const controller = RestaurantController.getInstance();

    const loadRestaurants = async () => {
        setLoading(true);
        const success = await controller.loadRestaurants();
        console.log(
            '🚀 ~ loadRestaurants ~ controller.getRestaurants():',
            controller.getRestaurants()
        );
        setRestaurants(controller.getRestaurants());
        setError(controller.getError());
        setLoading(false);
        return success;
    };

    const createRestaurant = async (data: Partial<Restaurant>) => {
        setLoading(true);
        const success = await controller.createRestaurant(data);
        setRestaurants(controller.getRestaurants());
        setError(controller.getError());
        setLoading(false);
        return success;
    };

    const updateRestaurant = async (id: string, data: Partial<Restaurant>) => {
        setLoading(true);
        const success = await controller.updateRestaurant(id, data);
        setRestaurants(controller.getRestaurants());
        setError(controller.getError());
        setLoading(false);
        return success;
    };

    const deleteRestaurant = async (id: string) => {
        setLoading(true);
        const success = await controller.deleteRestaurant(id);
        setRestaurants(controller.getRestaurants());
        setError(controller.getError());
        setLoading(false);
        return success;
    };

    const uploadMenu = async (id: string, menuFile: File) => {
        setLoading(true);
        const success = await controller.uploadMenu(id, menuFile);
        setRestaurants(controller.getRestaurants());
        setError(controller.getError());
        setLoading(false);
        return success;
    };

    useEffect(() => {
        loadRestaurants();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        restaurants,
        loading,
        error,
        loadRestaurants,
        createRestaurant,
        updateRestaurant,
        deleteRestaurant,
        uploadMenu,
    };
}
