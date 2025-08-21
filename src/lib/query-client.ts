/* eslint-disable @typescript-eslint/no-explicit-any */
import { DefaultOptions, QueryClient } from '@tanstack/react-query';

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
    mutations: {
        retry: 1,
    },
};

export const queryClient = new QueryClient({
    defaultOptions: queryConfig,
});

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
    // Users
    users: {
        all: ['users'] as const,
        lists: () => [...queryKeys.users.all, 'list'] as const,
        list: (filters?: any) => [...queryKeys.users.lists(), filters] as const,
        details: () => [...queryKeys.users.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.users.details(), id] as const,
        profile: () => [...queryKeys.users.all, 'profile'] as const,
    },
} as const;
