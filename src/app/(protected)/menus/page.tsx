import { RoleGuard } from '@/components/auth/RoleGuard';
import { MenusPage } from '@/features/menu';
import { queryClient, queryKeys } from '@/lib/query-client';
import { MenuFilters, menuService } from '@/service/menuService';
import { restaurantService } from '@/service/restaurants';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

export default async function MenusView() {
    const defaultFilters: MenuFilters = {
        page: 1,
        limit: 10,
        search: '',
        sortBy: 'createdAt' as 'createdAt' | 'name' | 'updatedAt',
        sortOrder: 'desc' as 'asc' | 'desc',
    };

    try {
        await queryClient.prefetchQuery({
            queryKey: queryKeys.menus.list(defaultFilters),
            queryFn: () => menuService.getAll(defaultFilters),
        });

        await queryClient.prefetchQuery({
            queryKey: queryKeys.restaurants.list(),
            queryFn: () => restaurantService.getAll(),
        });
    } catch (error) {
        console.error('Error prefetching data:', error);
    }

    return (
        <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
            <HydrationBoundary state={dehydrate(queryClient)}>
                <MenusPage />
            </HydrationBoundary>
        </RoleGuard>
    );
}
