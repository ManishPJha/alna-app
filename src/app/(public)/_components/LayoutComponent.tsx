'use client';

import MainContainer from '@/shared/components/layout/MainContainer';
import { usePathname } from 'next/navigation';
import React from 'react';

type ExcludedPaths = '/auth/signin' | '/auth/signup' | string;

const LayoutComponent = ({
    children,
    excludePaths,
}: {
    children: React.ReactNode;
    excludePaths: string[];
}) => {
    const pathname = usePathname();

    // Check if current path is a menu page
    const isMenuPage = pathname.startsWith('/menu/');

    return (
        <>
            {excludePaths.includes(pathname as ExcludedPaths) || isMenuPage ? (
                children
            ) : (
                <MainContainer>{children}</MainContainer>
            )}
        </>
    );
};

export default LayoutComponent;
