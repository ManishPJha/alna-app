import { RoleGuard } from '@/components/auth/RoleGuard';
import { auth } from '@/features/auth/handlers';
import { ManagersPage } from '@/features/managers';

export default async function ManagersView() {
    const session = await auth();

    if (!session) {
        return <div>Unauthorized</div>;
    }

    return (
        <RoleGuard allowedRoles={['ADMIN']}>
            <ManagersPage currentUser={session?.user} />
        </RoleGuard>
    );
}
