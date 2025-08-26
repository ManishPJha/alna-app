'use client';

import { useRole } from '@/features/auth';
import Link from 'next/link';

export function RoleBasedNav() {
    const { role, isAdmin, isManager, hasRestaurant } = useRole();

    return (
        <nav className="flex space-x-4">
            {/* Common links for all authenticated users */}
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/profile">Profile</Link>

            {/* Admin-only links */}
            {isAdmin && (
                <>
                    <Link href="/admin/users">Users</Link>
                    <Link href="/admin/restaurants">Restaurants</Link>
                    <Link href="/admin/analytics">Analytics</Link>
                </>
            )}

            {/* Manager links (with restaurant check) */}
            {isManager && hasRestaurant && (
                <>
                    <Link href="/manager/menu">Menu</Link>
                    <Link href="/manager/orders">Orders</Link>
                    <Link href="/manager/qr-codes">QR Codes</Link>
                </>
            )}

            {/* Show both admin and manager links for admins */}
            {isAdmin && (
                <>
                    <Link href="/manager/menu">Menu Management</Link>
                    <Link href="/manager/orders">Order Management</Link>
                </>
            )}
        </nav>
    );
}
