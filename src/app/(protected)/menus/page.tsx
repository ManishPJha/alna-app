import { RoleGuard } from '@/components/auth/RoleGuard';
import { auth } from '@/features/auth/handlers';
import { MenusPage } from '@/features/menu';

export default async function MenusView() {
    const session = await auth();

    if (!session?.user) {
        return <div>Unauthorized</div>;
    }

    return (
        <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
            <MenusPage currentUser={session?.user} />
        </RoleGuard>
    );
}
