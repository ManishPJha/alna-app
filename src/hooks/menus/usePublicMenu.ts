import { MenuFormData } from '@/types/menu';
import { useQuery } from '@tanstack/react-query';

export const usePublicMenu = (id: string) => {
    return useQuery({
        queryKey: ['public-menu', id],
        queryFn: async () => {
            const response = await fetch(`/api/public/menus/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch menu');
            }
            return response.json() as Promise<MenuFormData>;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!id,
    });
}; 