import { getSession } from '@/features/auth';
import { AdminDashboard } from '@/features/dashboard';

const DashboardPage = async () => {
    const session = await getSession();

    return <AdminDashboard currentUser={session?.user} />;
};

export default DashboardPage;
