import { RoleGuard } from '@/components/auth/RoleGuard';
import { auth } from '@/features/auth/handlers';
import { QRCodesPage } from '@/features/qrCodes';
import { queryKeys } from '@/lib/query-client';
import { menuService } from '@/service/menuService';
import { restaurantService } from '@/service/restaurants';
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from '@tanstack/react-query';

export default async function QRCodesView() {
    const session = await auth();

    if (!session) {
        return <div>Unauthorized</div>;
    }

    const queryClient = new QueryClient();
    const user = session.user;

    try {
        // Prefetch based on user role
        if (user.role === 'ADMIN') {
            // Prefetch restaurants for admin with pagination
            await queryClient.prefetchQuery({
                queryKey: queryKeys.restaurants.list({ page: 1, limit: 10 }),
                queryFn: () => restaurantService.getAll({ page: 1, limit: 10 }),
            });
        } else if (user.role === 'MANAGER' && user.restaurantId) {
            // Prefetch specific restaurant data for manager
            await queryClient.prefetchQuery({
                queryKey: queryKeys.restaurants.detail(user.restaurantId),
                queryFn: () => restaurantService.getById(user.restaurantId!),
            });

            // Prefetch menus for the manager's restaurant
            await queryClient.prefetchQuery({
                queryKey: queryKeys.menus.list({
                    restaurantId: user.restaurantId,
                }),
                queryFn: () =>
                    menuService.getAll({ restaurantId: user.restaurantId }),
            });

            // Prefetch QR codes for the manager's restaurant
            const restaurant = await queryClient.fetchQuery({
                queryKey: queryKeys.restaurants.detail(user.restaurantId),
                queryFn: () => restaurantService.getById(user.restaurantId!),
            });

            if (restaurant.data) {
                // Get the default menu for QR code generation
                const menus = await queryClient.fetchQuery({
                    queryKey: queryKeys.menus.list({
                        restaurantId: user.restaurantId,
                    }),
                    queryFn: () =>
                        menuService.getAll({ restaurantId: user.restaurantId }),
                });

                const defaultMenu = menus.data?.menus?.[0];
                if (defaultMenu) {
                    await queryClient.prefetchQuery({
                        queryKey: queryKeys.qrCodes.byMenu(defaultMenu.id),
                        queryFn: () =>
                            fetch(`/api/qrcodes?menuId=${defaultMenu.id}`).then(
                                (res) => res.json()
                            ),
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error prefetching data:', error);
    }

    return (
        <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
            <HydrationBoundary state={dehydrate(queryClient)}>
                <QRCodesPage currentUser={session?.user} />
            </HydrationBoundary>
        </RoleGuard>
    );
}
