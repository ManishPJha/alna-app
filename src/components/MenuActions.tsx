'use client';

import { useRole } from '@/features/auth';
import { permissions } from '@/utils/rbac';

interface MenuActionsProps {
    restaurantId: string;
    userRestaurantId?: string;
}

export function MenuActions({
    restaurantId,
    userRestaurantId,
}: MenuActionsProps) {
    const { role } = useRole();

    if (!role) return null;

    const isOwnRestaurant = restaurantId === userRestaurantId;
    const canEdit = permissions.canEditMenu(role, isOwnRestaurant);
    const canPublish = permissions.canPublishMenu(role, isOwnRestaurant);

    return (
        <div className="flex gap-2">
            {canEdit && (
                <button className="px-4 py-2 bg-blue-600 text-white rounded">
                    Edit Menu
                </button>
            )}
            {canPublish && (
                <button className="px-4 py-2 bg-green-600 text-white rounded">
                    Publish Menu
                </button>
            )}
        </div>
    );
}
