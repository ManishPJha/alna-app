import { getSession } from '@/features/auth';
import { MenusPage } from '@/features/menu';

export default async function MenusView() {
    const session = await getSession();

    if (!session?.user) {
        return <div>Unauthorized</div>;
    }

    return <MenusPage currentUser={session?.user} />;
}
