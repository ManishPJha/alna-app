import {
    DefaultOptions,
    defaultShouldDehydrateQuery,
    isServer,
    QueryClient,
} from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
    queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: (failureCount, error: any) => {
            // Don't retry on 4xx errors (client errors)
            if (error?.status >= 400 && error?.status < 500) {
                return false;
            }
            // Retry up to 3 times for other errors
            return failureCount < 3;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
    },
    dehydrate: {
        // include pending queries in dehydration
        shouldDehydrateQuery: (query) =>
            defaultShouldDehydrateQuery(query) ||
            query.state.status === 'pending',
    },
    mutations: {
        retry: 1,
    },
};

// export const queryClient = new QueryClient({
//     defaultOptions: queryConfig,
// });

function makeQueryClient(skipDefaults = false) {
    return new QueryClient(skipDefaults ? {} : { defaultOptions: queryConfig });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
    if (isServer) {
        // Server: always make a new query client
        return makeQueryClient(true);
    } else {
        // Browser: make a new query client if we don't already have one
        // This is very important, so we don't re-make a new client if React
        // suspends during the initial render. This may not be needed if we
        // have a suspense boundary BELOW the creation of the query client
        if (!browserQueryClient) browserQueryClient = makeQueryClient();
        return browserQueryClient;
    }
}

export const queryClient = getQueryClient();

// Query Keys - Centralized key management
export const queryKeys = {
    // Restaurants
    restaurants: {
        all: ['restaurants'] as const,
        lists: () => [...queryKeys.restaurants.all, 'list'] as const,
        list: (filters?: any) =>
            [...queryKeys.restaurants.lists(), filters] as const,
        details: () => [...queryKeys.restaurants.all, 'detail'] as const,
        detail: (id: string) =>
            [...queryKeys.restaurants.details(), id] as const,
        stats: (id: string) =>
            [...queryKeys.restaurants.detail(id), 'stats'] as const,
    },
    // Menu queries
    menus: {
        all: ['menus'] as const,
        lists: () => [...queryKeys.menus.all, 'list'] as const,
        list: (filters?: any) =>
            [...queryKeys.menus.lists(), { filters }] as const,
        byRestaurant: (restaurantId: string, filters?: any) =>
            [
                ...queryKeys.menus.lists(),
                'restaurant',
                restaurantId,
                { filters },
            ] as const,
        details: () => [...queryKeys.menus.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.menus.details(), id] as const,
        public: (id: string) => ['menus', 'public', id] as const,
    },
    // Users
    users: {
        all: ['users'] as const,
        lists: () => [...queryKeys.users.all, 'list'] as const,
        list: (filters?: any) => [...queryKeys.users.lists(), filters] as const,
        details: () => [...queryKeys.users.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.users.details(), id] as const,
        profile: () => [...queryKeys.users.all, 'profile'] as const,
    },
    // Orders
    orders: {
        all: ['orders'] as const,
        lists: () => [...queryKeys.orders.all, 'list'] as const,
        list: (filters?: any) =>
            [...queryKeys.orders.lists(), filters] as const,
        byRestaurant: (restaurantId: string, filters?: any) =>
            [
                ...queryKeys.orders.lists(),
                'restaurant',
                restaurantId,
                filters,
            ] as const,
        details: () => [...queryKeys.orders.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.orders.details(), id] as const,
        stats: (restaurantId: string, period?: string) =>
            [...queryKeys.orders.all, 'stats', restaurantId, period] as const,
    },
    // QR Codes
    qrCodes: {
        all: ['qrCodes'] as const,
        lists: () => [...queryKeys.qrCodes.all, 'list'] as const,
        list: (filters?: any) =>
            [...queryKeys.qrCodes.lists(), filters] as const,
        byRestaurant: (restaurantId: string, filters?: any) =>
            [
                ...queryKeys.qrCodes.lists(),
                'restaurant',
                restaurantId,
                filters,
            ] as const,
        byMenu: (menuId: string, filters?: any) =>
            [...queryKeys.qrCodes.lists(), 'menu', menuId, filters] as const,
        details: () => [...queryKeys.qrCodes.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.qrCodes.details(), id] as const,
        stats: (restaurantId: string, period?: string) =>
            [...queryKeys.qrCodes.all, 'stats', restaurantId, period] as const,
        analytics: (qrCodeId: string, period?: string) =>
            [
                ...queryKeys.qrCodes.detail(qrCodeId),
                'analytics',
                period,
            ] as const,
    },
} as const;
