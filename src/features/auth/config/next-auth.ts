/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaAdapter } from '@auth/prisma-adapter';
import { type UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { type DefaultSession, type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import { authConfig } from '@/config/appConfig';
import { signOut } from '@/features/auth';
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
            restaurantId: string;
        } & DefaultSession['user'];
    }

    // interface User {
    //   // ...other properties
    //   // role: UserRole;
    // }
}

async function logOutUser() {
    'use server';
    await signOut({ redirectTo: '/auth/signin' });
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const nextAuthConfig = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    return null;
                }

                try {
                    const user = await db.user.findUnique({
                        where: { email: credentials.email as string },
                    });

                    if (!user || !user.passwordHash) {
                        return null;
                    }

                    const isValidPassword = await bcrypt.compare(
                        credentials.password as string,
                        user.passwordHash
                    );

                    if (!isValidPassword) {
                        return null;
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        image: user.image,
                    };
                } catch (error) {
                    console.error('Error during authentication:', error);
                    return null;
                }
            },
        }),
        GoogleProvider({
            clientId: authConfig.googleClientId,
            clientSecret: authConfig.googleClientSecret,
        }),
    ],
    // adapter: PrismaAdapter(db),
    adapter: PrismaAdapter(db),
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    jwt: {
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async signIn({ user, account }) {
            // Allow OAuth sign-ins
            if (account?.provider !== 'credentials') {
                return true;
            }

            // For credentials, check if user exists and is active
            if (user?.email) {
                const dbUser = await db.user.findUnique({
                    where: { email: user.email },
                });
                return dbUser?.isActive ?? false;
            }

            return false;
        },
        async jwt({ token, user, account }) {
            // Initial sign in
            if (user) {
                token.role = (user as unknown as any).role as UserRole;
                token.id = user.id;
            }

            // Handle account linking for OAuth providers
            if (account?.provider === 'google' && user?.email) {
                const dbUser = await db.user.findUnique({
                    where: { email: user.email },
                });

                if (dbUser) {
                    token.role = dbUser.role;
                    token.id = dbUser.id;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (token) {
                console.log('+++++++++++++token', token);
                console.log(' ----- session', session);

                // validate token
                const dbUser = await db.user.findUnique({
                    where: { id: token.id as string },
                });

                if (!dbUser) {
                    await logOutUser();
                }

                session.user.id = token.id as string;
                session.user.role = token.role as UserRole;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith('/')) return `${baseUrl}${url}`;
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        },
    },
    pages: {
        signIn: '/auth/signin',
        signOut: '/auth/signin',
        error: '/auth/signin',
    },
    events: {
        async signIn({ user, account, isNewUser }) {
            console.log(
                `User ${user.email} signed in with ${account?.provider}`
            );

            // Update last login time for existing users
            if (!isNewUser && user.id) {
                await db.user.update({
                    where: { id: user.id },
                    data: { updatedAt: new Date() },
                });
            }
        },
        async signOut({ token }: any) {
            console.log(`User signed out: ${token?.email}`);
        },
    },
    debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;
