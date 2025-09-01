import { RoleGuard } from '@/components/auth/RoleGuard';
import { auth } from '@/features/auth/handlers';
import { MenusPage } from '@/features/menu';
import { queryKeys } from '@/lib/query-client';
import { MenuFilters } from '@/service/menuService';
import { restaurantService } from '@/service/restaurants';
import { userService } from '@/service/users';
import {
    HydrationBoundary,
    QueryClient,
    dehydrate,
} from '@tanstack/react-query';

export default async function MenusView() {
    const session = await auth();

    if (!session?.user) {
        return <div>Unauthorized</div>;
    }

    const queryClient = new QueryClient();

    const defaultFilters: MenuFilters = {
        page: 1,
        limit: 10,
        search: '',
        sortBy: 'createdAt' as 'createdAt' | 'name' | 'updatedAt',
        sortOrder: 'desc' as 'asc' | 'desc',
    };

    await queryClient.prefetchQuery({
        queryKey: queryKeys.users.list(defaultFilters),
        queryFn: () => userService.getAll(defaultFilters),
    });

    await queryClient.prefetchQuery({
        queryKey: queryKeys.restaurants.list(),
        queryFn: () => restaurantService.getAll(),
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
                <MenusPage currentUser={session?.user} />
            </RoleGuard>
        </HydrationBoundary>
    );
}
