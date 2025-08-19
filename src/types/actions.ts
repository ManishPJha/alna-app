import { UserRole } from '@prisma/client';

export interface SignUpActionPayload {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    restaurantId: string;
}

export type SignInActionPayload = Pick<
    SignUpActionPayload,
    'email' | 'password'
>;
