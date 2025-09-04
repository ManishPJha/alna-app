import { RoleGuard } from '@/components/auth/RoleGuard';
import { auth } from '@/features/auth/handlers';
import { QRCodesPage } from '@/features/qrCodes';
import { queryClient, queryKeys } from '@/lib/query-client';
import { menuService } from '@/service/menuService';
import { restaurantService } from '@/service/restaurants';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export default async function QRCodesView() {
    const session = await auth();

    if (session?.user) {
        const user = session.user;

        try {
            if (user.role === 'ADMIN') {
                // Prefetch restaurants for admin with the exact filters used in QRCodesPage
                await queryClient.prefetchQuery({
                    queryKey: queryKeys.restaurants.list({
                        page: 1,
                        limit: 10,
                        search: undefined,
                    }),
                    queryFn: () =>
                        restaurantService.getAll({
                            page: 1,
                            limit: 50,
                            search: undefined,
                        }),
                });

                // Get first restaurant to prefetch its menus
                const restaurantsData = await queryClient.getQueryData(
                    queryKeys.restaurants.list({
                        page: 1,
                        limit: 10,
                        search: undefined,
                    })
                );

                const firstRestaurant = (restaurantsData as any)?.data
                    ?.restaurants?.[0];
                if (firstRestaurant) {
                    // Prefetch menus for the first restaurant
                    await queryClient.prefetchQuery({
                        queryKey: queryKeys.menus.list({
                            restaurantId: firstRestaurant.id,
                            page: 1,
                            limit: 10,
                        }),
                        queryFn: () =>
                            menuService.getAll({
                                restaurantId: firstRestaurant.id,
                                page: 1,
                                limit: 10,
                            }),
                    });

                    // Get first menu to prefetch QR codes
                    const menusData = await queryClient.getQueryData(
                        queryKeys.menus.list({
                            restaurantId: firstRestaurant.id,
                            page: 1,
                            limit: 10,
                        })
                    );

                    const firstMenu = (menusData as any)?.data?.menus?.[0];
                    if (firstMenu) {
                        // Prefetch QR codes for the first menu using the exact API call from QRCodesPage
                        await queryClient.prefetchQuery({
                            queryKey: ['qrCodes', 'byMenu', firstMenu.id],
                            queryFn: async () => {
                                const response = await fetch(
                                    `/api/qrcodes?menuId=${firstMenu.id}`,
                                    {
                                        cache: 'no-store',
                                    }
                                );
                                return response.json();
                            },
                        });
                    }
                }
            } else if (user.role === 'MANAGER' && user.restaurantId) {
                // For managers, prefetch their restaurant's data with exact filters
                await queryClient.prefetchQuery({
                    queryKey: queryKeys.restaurants.list({
                        page: 1,
                        limit: 10,
                        search: undefined,
                        restaurantId: user.restaurantId,
                    }),
                    queryFn: () =>
                        restaurantService.getAll({
                            page: 1,
                            limit: 10,
                            // restaurantId: user.restaurantId,
                        }),
                });

                // Prefetch menus for the manager's restaurant
                await queryClient.prefetchQuery({
                    queryKey: queryKeys.menus.list({
                        restaurantId: user.restaurantId,
                        page: 1,
                        limit: 10,
                    }),
                    queryFn: () =>
                        menuService.getAll({
                            restaurantId: user.restaurantId,
                            page: 1,
                            limit: 10,
                        }),
                });

                // Get the menus data to prefetch QR codes for the first menu
                const menusData = await queryClient.getQueryData(
                    queryKeys.menus.list({
                        restaurantId: user.restaurantId,
                        page: 1,
                        limit: 10,
                    })
                );

                const firstMenu = (menusData as any)?.data?.menus?.[0];
                if (firstMenu) {
                    // Prefetch QR codes using the exact API call from QRCodesPage
                    await queryClient.prefetchQuery({
                        queryKey: ['qrCodes', 'byMenu', firstMenu.id],
                        queryFn: async () => {
                            const response = await fetch(
                                `/api/qrcodes?menuId=${firstMenu.id}`,
                                {
                                    cache: 'no-store',
                                }
                            );
                            return response.json();
                        },
                    });
                }
            }
        } catch (error) {
            console.error('Error prefetching data:', error);
            // Don't throw - let the component handle loading states
        }
    }

    return (
        <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
            <HydrationBoundary state={dehydrate(queryClient)}>
                <QRCodesPage currentUser={session?.user} />
            </HydrationBoundary>
        </RoleGuard>
    );
}
