import { RoleGuard } from '@/components/auth/RoleGuard';
import { OrderHistoryPageClient } from '@/features/order';

export default async function OrderHistoryPage() {
    return (
        <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
            <OrderHistoryPageClient />
        </RoleGuard>
    );
}
