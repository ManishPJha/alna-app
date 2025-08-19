'use client';

import MainContainer from '@/shared/components/layout/MainContainer';
import { usePathname } from 'next/navigation';
import React from 'react';

type ExcludedPaths = '/auth/signin' | '/auth/signup';

const LayoutComponent = ({
    children,
    excludePaths,
}: {
    children: React.ReactNode;
    excludePaths: string[];
}) => {
    const pathname = usePathname();

    return (
        <>
            {excludePaths.includes(pathname as ExcludedPaths) ? (
                children
            ) : (
                <MainContainer>{children}</MainContainer>
            )}
        </>
    );
};

export default LayoutComponent;
