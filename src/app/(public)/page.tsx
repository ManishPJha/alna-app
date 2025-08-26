'use client';

import { paths } from '@/config/routes';
import { usePublicSession } from '@/features/auth';
import { redirect } from 'next/navigation';

const LandingPage = () => {
    const session = usePublicSession();

    if (session) {
        redirect(paths.dashboard);
    }

    redirect(paths.signIn);

    return null;
};

export default LandingPage;
