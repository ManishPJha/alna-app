'use server';

import { paths } from '@/config/routes';
import { signOut } from '@/features/auth';
import { db } from '@/lib/db';
import type { SignUpActionPayload } from '@/types/actions';
import { createServiceContext } from '@/utils/service-utils';
import { type User, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const { log, handleError } = createServiceContext('authAction');

export const signUpAction = async (payload: SignUpActionPayload) => {
    log.info('signUpAction with payload -', payload);
    let user: User | null = null;

    try {
        // Hash the password
        const passwordHash = await bcrypt.hash(payload.password, 10);

        // Create the user
        user = await db.user.create({
            data: {
                email: payload.email,
                name: payload.name,
                passwordHash,
                role: payload.role,
            },
        });

        // If the user is a manager, create a Manager record
        if (payload.role === UserRole.MANAGER && payload.restaurantId) {
            await db.user.create({
                data: {
                    name: payload.name,
                    email: payload.email,
                    restaurantId: payload.restaurantId,
                    role: payload.role,
                },
            });
        }

        return user;
    } catch (error) {
        log.error('signUpAction error -', error);

        if (user) {
            await db.user.delete({
                where: {
                    id: user.id,
                },
            });
        }

        return handleError('signUpAction', error, {
            customMessage: 'Error signing up user',
            rethrow: true,
        });
    }
};

export const logOutAction = async () => {
    await signOut({ redirectTo: paths.signIn });
};
