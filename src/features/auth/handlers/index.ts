import NextAuth from 'next-auth';
import { cache } from 'react';

// import { nextAuthConfig } from '../config/next-auth';

import { authConfig } from '@/lib/auth';

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };
