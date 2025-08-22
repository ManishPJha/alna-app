'use client';

import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { Session } from 'next-auth';
import { useEffect, useState } from 'react';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
    const [currentUser, setCurrentUser] = useState<Session['user'] | undefined>(
        undefined
    );

    useEffect(() => {
        // Simulate fetching user session
        const fetchUserSession = async () => {
            const session = await fetch('/api/auth/session').then((res) =>
                res.json()
            );
            setCurrentUser(session.user || null);
        };

        fetchUserSession();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Fixed Header */}
            <DashboardHeader currentUser={currentUser} />

            <div className="flex">
                {/* Persistent Fixed Sidebar */}
                <div className="w-64 min-h-screen bg-white shadow-lg border-r border-gray-200 fixed left-0 top-12 pt-20 z-40">
                    <DashboardSidebar currentUser={currentUser} />
                </div>

                {/* Main Content Area with left margin to account for fixed sidebar */}
                <div className="flex-1 ml-64 pt-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
