'use client';

import { UserRole } from '@/types/routes';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
    fallbackPath?: string;
    loading?: React.ReactNode;
}

export function RoleGuard({
    children,
    allowedRoles,
    fallbackPath = '/dashboard',
    loading = <div>Loading...</div>,
}: RoleGuardProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (status === 'loading') return;

        if (!session?.user) {
            router.push('/auth/signin');
            return;
        }

        const userRole = session.user.role;

        if (!allowedRoles.includes(userRole)) {
            router.push(fallbackPath);
            return;
        }

        setIsAuthorized(true);
    }, [session, status, allowedRoles, fallbackPath, router]);

    if (status === 'loading' || !isAuthorized) {
        return <>{loading}</>;
    }

    return <>{children}</>;
}
