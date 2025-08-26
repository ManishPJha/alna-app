'use client';

import { useRole } from '@/features/auth';

export function AdminOnlyFeature() {
    const { isAdmin, isLoading } = useRole();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAdmin) {
        return null; // Or show a message
    }

    return (
        <div className="p-4 bg-red-100 rounded">
            <h3>Admin Only Feature</h3>
            <p>This is only visible to administrators.</p>
        </div>
    );
}
