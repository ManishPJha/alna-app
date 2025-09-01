import { RoleGuard } from '@/components/auth/RoleGuard';
import { auth } from '@/features/auth/handlers';
import { SettingsPageClient } from '@/features/settings';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

async function getUserData(userId: string) {
    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    address: true,
                    description: true,
                    defaultLanguage: true,
                    timezone: true,
                    logoUrl: true,
                    themeColor: true,
                },
            },
        },
    });

    if (!user) {
        notFound();
    }

    return user;
}

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user) {
        notFound();
    }

    const user = await getUserData(session.user.id);

    return (
        <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Settings
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Manage your profile and system configuration
                        </p>
                    </div>

                    {/* Client Component with User Data */}
                    <SettingsPageClient user={user} />
                </div>
            </div>
        </RoleGuard>
    );
}
