'use server';

import { db } from '@/lib/db';
import type { SignUpActionPayload } from '@/types/actions';
import { createServiceContext } from '@/utils/service-utils';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const { log, handleError } = createServiceContext('authAction');

export const signUpAction = async (payload: SignUpActionPayload) => {
    log.info('signUpAction with payload -', payload);
    try {
        // Hash the password
        const passwordHash = await bcrypt.hash(payload.password, 10);

        // Create the user
        const user = await db.user.create({
            data: {
                email: payload.email,
                name: payload.name,
                passwordHash,
                role: payload.role,
            },
        });

        // If the user is a manager, create a Manager record
        if (payload.role === UserRole.MANAGER) {
            await db.manager.create({
                data: {
                    userId: user.id,
                    name: payload.name,
                    email: payload.email,
                    restaurantId: payload.restaurantId,
                    role: payload.role,
                },
            });
        }
    } catch (error) {
        log.error('signUpAction error -', error);
        return handleError('signUpAction', error, {
            customMessage: 'Error signing up user',
            rethrow: true,
        });
    }
};
