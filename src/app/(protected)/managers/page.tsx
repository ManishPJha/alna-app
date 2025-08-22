import { getSession } from '@/features/auth';
import { ManagersPage } from '@/features/managers';

export default async function ManagersView() {
    const session = await getSession();

    if (!session) {
        return <div>Unauthorized</div>;
    }

    return <ManagersPage currentUser={session?.user} />;
}
