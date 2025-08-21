// app/(dashboard)/layout.tsx
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { Toaster } from '@/components/ui/sonner';
import { getSession } from '@/features/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/auth/signin');
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardSidebar />
            <div className="lg:pl-64">
                <DashboardHeader user={session.user} />
                <main className="py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Suspense fallback={<div>Loading...</div>}>
                            {children}
                        </Suspense>
                    </div>
                </main>
            </div>
            <Toaster />
        </div>
    );
}
