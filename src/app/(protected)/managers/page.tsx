import { RoleGuard } from '@/components/auth/RoleGuard';
import { ManagersPage } from '@/features/managers';
import { queryClient, queryKeys } from '@/lib/query-client';
import { restaurantService } from '@/service/restaurants';
import { UserFilters, userService } from '@/service/users';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

export default async function ManagersView() {
    const defaultFilters: UserFilters = {
        page: 1,
        limit: 10,
        search: '',
        sortBy: 'createdAt' as 'createdAt' | 'name' | 'email' | 'updatedAt',
        sortOrder: 'desc' as 'asc' | 'desc',
    };

    try {
        await queryClient.prefetchQuery({
            queryKey: queryKeys.users.list(defaultFilters),
            queryFn: () => userService.getAll(defaultFilters),
        });

        await queryClient.prefetchQuery({
            queryKey: queryKeys.restaurants.list(),
            queryFn: () => restaurantService.getAll(),
        });
    } catch (error) {
        console.error('Error prefetching data:', error);
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <RoleGuard allowedRoles={['ADMIN']}>
                <ManagersPage />
            </RoleGuard>
        </HydrationBoundary>
    );
}
