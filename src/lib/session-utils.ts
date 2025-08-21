import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authConfig } from './auth';

export async function getRequiredSession() {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
        redirect('/auth/signin');
    }

    return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
    const session = await getRequiredSession();

    if (!allowedRoles.includes(session.user.role)) {
        redirect('/dashboard'); // Redirect to dashboard if insufficient permissions
    }

    return session;
}

export async function requireAdmin() {
    return requireRole(['ADMIN']);
}

export async function requireAdminOrManager() {
    return requireRole(['ADMIN', 'MANAGER']);
}
