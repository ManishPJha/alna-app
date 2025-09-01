/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';

interface PublicMenuData {
    id: string;
    name: string;
    description?: string;
    restaurant: {
        id: string;
        name: string;
        description?: string;
        logoUrl?: string;
        themeColor?: string;
    };
    categories: Array<{
        id: string;
        name: string;
        description?: string;
        displayOrder: number;
        items: Array<{
            id: string;
            name: string;
            description?: string;
            price: number;
            imageUrl?: string;
            preparationTime?: number;
            calories?: number;
            isVegetarian: boolean;
            isVegan: boolean;
            isGlutenFree: boolean;
            isSpicy: boolean;
            spiceLevel?: number;
            isBestseller?: boolean;
            displayOrder: number;
            tags?: any;
            nutritionInfo?: any;
        }>;
    }>;
    faqs: Array<{
        id: string;
        question: string;
        answer: string;
        category?: string;
    }>;
    theme: {
        primaryColor: string;
        backgroundColor: string;
        accentColor: string;
        fontFamily: string;
    };
}

export const usePublicMenu = (id: string) => {
    return useQuery({
        queryKey: ['public-menu', id],
        queryFn: async (): Promise<PublicMenuData> => {
            const response = await fetch(`/api/public/menus/${id}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Menu not found');
                }
                throw new Error('Failed to fetch menu');
            }

            const data = await response.json();

            // The API returns the menu data directly, not wrapped in a data property
            // Transform the API response to match our expected structure
            return {
                id: data.id,
                name: data.name,
                description: data.description,
                restaurant: data.restaurant,
                categories: data.categories || [],
                faqs: data.faqs || [],
                theme: data.theme || {
                    primaryColor: '#1f2937',
                    backgroundColor: '#ffffff',
                    accentColor: '#ef4444',
                    fontFamily: 'Inter',
                },
            };
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!id,
        retry: (failureCount, error) => {
            // Don't retry if it's a 404 error
            if (error instanceof Error && error.message === 'Menu not found') {
                return false;
            }
            // Retry up to 2 times for other errors
            return failureCount < 2;
        },
    });
};
