/* eslint-disable @typescript-eslint/no-explicit-any */
import { authConfig as authConfigOptions } from '@/features/auth/config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { db } from './db';

export const authConfig = {
    adapter: PrismaAdapter(db),
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await db.user.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!user || !user.passwordHash || !user.isActive) return null;

                const isValid = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash
                );

                if (!isValid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    image: user.image,
                };
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours
    },
    // jwt: {
    //     maxAge: 24 * 60 * 60, // 24 hours
    // },
    // cookies: {
    //     sessionToken: {
    //         name: `next-auth.session-token`,
    //         options: {
    //             httpOnly: true,
    //             sameSite: 'lax',
    //             path: '/',
    //             secure: process.env.NODE_ENV === 'production',
    //         },
    //     },
    // },
    cookies: {
        sessionToken: {
            name: authConfigOptions.sessionCookieName,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
        // callbackUrl: {
        //     name: `__Secure-next-auth.callback-url`,
        //     options: {
        //         sameSite: 'lax',
        //         path: '/',
        //         secure: true,
        //     },
        // },
        csrfToken: {
            name: authConfigOptions.csrfCookieName,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as unknown as any).role as UserRole;
                token.id = user.id;
                token.restaurantId = (user as unknown as any)
                    .restaurantId as string;
            }

            // Validate user still exists and is active
            if (token.id) {
                const dbUser = await db.user.findUnique({
                    where: { id: token.id as string },
                    select: { isActive: true, role: true, restaurantId: true },
                });

                if (!dbUser || !dbUser.isActive) {
                    return {}; // Invalidate token
                }

                token.role = dbUser.role;
                token.restaurantId = dbUser.restaurantId;
            }

            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as UserRole;
                session.user.restaurantId = token.restaurantId as string;
            }
            return session;
        },
        async signIn({ user, account }) {
            // For OAuth providers, ensure user exists and is active
            if (account?.provider === 'google' && user.email) {
                const dbUser = await db.user.findUnique({
                    where: { email: user.email },
                });

                if (!dbUser || !dbUser.isActive) {
                    return false;
                }
            }

            return true;
        },
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/signin',
    },
    events: {
        async signOut({ token }: any) {
            console.log(`User signed out: ${token?.email}`);
        },
    },
} satisfies NextAuthConfig;
