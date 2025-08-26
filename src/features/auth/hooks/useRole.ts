/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { UserRole } from '@/types/routes';
import { useSession } from 'next-auth/react';

export function useRole() {
    const { data: session, status } = useSession();

    const userRole = (session?.user as any)?.role as UserRole | undefined;
    const restaurantId = (session?.user as any)?.restaurantId as
        | string
        | undefined;

    return {
        role: userRole,
        restaurantId,
        isAdmin: userRole === 'ADMIN',
        isManager: userRole === 'MANAGER',
        isUser: userRole === 'USER',
        isLoading: status === 'loading',
        hasRestaurant: !!restaurantId,
        canManageRestaurant:
            userRole === 'ADMIN' || (userRole === 'MANAGER' && !!restaurantId),
    };
}
