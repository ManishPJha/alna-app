import { PrismaAdapter } from '@auth/prisma-adapter';
import { type UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { type DefaultSession, type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import { authConfig } from '@/config/appConfig';
import { db } from '@/lib/db';

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module 'next-auth' {
    interface Session extends DefaultSession {
        user: {
            id: string;
            // ...other properties
            role: UserRole;
        } & DefaultSession['user'];
    }

    // interface User {
    //   // ...other properties
    //   // role: UserRole;
    // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const nextAuthConfig = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    return null;
                }

                const user = await db.user.findUnique({
                    where: { email: credentials?.email as string },
                });

                if (user && user.passwordHash) {
                    console.log('user -', user);
                    // Verify password (e.g., using bcrypt)
                    if (
                        await bcrypt.compare(
                            credentials.password as string,
                            user.passwordHash
                        )
                    ) {
                        return {
                            id: user.id,
                            email: user.email,
                            role: user.role,
                        };
                    }

                    // return { id: user.id, email: user.email, role: user.role };
                }
                return null;
            },
        }),
        GoogleProvider({
            clientId: authConfig.googleClientId,
            clientSecret: authConfig.googleClientSecret,
        }),
        /**
         * ...add more providers here.
         *
         * Most other providers require a bit more work than the Discord provider. For example, the
         * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
         * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
         *
         * @see https://next-auth.js.org/providers/github
         */
    ],
    adapter: PrismaAdapter(db),
    callbacks: {
        session: ({ session, user }) => ({
            ...session,
            user: {
                ...session.user,
                role: (user as unknown as { role: UserRole }).role,
                id: user.id,
            },
        }),
    },
    pages: {
        signIn: '/auth/signin',
    },
} satisfies NextAuthConfig;
