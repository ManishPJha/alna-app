import { RoleGuard } from '@/components/auth/RoleGuard';
import { auth } from '@/features/auth/handlers';
import { ManagersPage } from '@/features/managers';
import { queryKeys } from '@/lib/query-client';
import { restaurantService } from '@/service/restaurants';
import { UserFilters, userService } from '@/service/users';
import {
    HydrationBoundary,
    QueryClient,
    dehydrate,
} from '@tanstack/react-query';

export default async function ManagersView() {
    const session = await auth();

    if (!session) {
        return <div>Unauthorized</div>;
    }

    const queryClient = new QueryClient();

    const defaultFilters: UserFilters = {
        page: 1,
        limit: 10,
        search: '',
        sortBy: 'createdAt' as 'createdAt' | 'name' | 'email' | 'updatedAt',
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
            <RoleGuard allowedRoles={['ADMIN']}>
                <ManagersPage currentUser={session?.user} />
            </RoleGuard>
        </HydrationBoundary>
    );
}
