import { db } from '@/lib/db';

export const checkAuth = async (userId: string) => {
    const user = await db.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        return null;
    }

    return user;
};

export const isAdmin = async (userId: string) => {
    const user = await checkAuth(userId);

    if (!user) {
        return false;
    }

    return user.role === 'ADMIN';
};

export const isManager = async (userId: string) => {
    const user = await checkAuth(userId);

    if (!user) {
        return false;
    }

    return user.role === 'MANAGER';
};
