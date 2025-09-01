'use client';

import {
    ListOrdered,
    Menu,
    QrCode,
    Settings,
    Store,
    Users,
} from 'lucide-react';
import { Session } from 'next-auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardSidebarProps {
    currentUser?: Session['user'];
}

export const DashboardSidebar = ({ currentUser }: DashboardSidebarProps) => {
    const pathname = usePathname();

    const navigationItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: Settings,
            activePattern: /^\/dashboard$/,
        },
        ...(currentUser?.role === 'ADMIN'
            ? [
                  {
                      name: 'Restaurants',
                      href: '/restaurants',
                      icon: Store,
                      activePattern: /^\/restaurants/,
                  },
                  {
                      name: 'Owners',
                      href: '/managers',
                      icon: Users,
                      activePattern: /^\/managers/,
                  },
              ]
            : []),
        {
            name: 'Menu Management',
            href: '/menus',
            icon: Menu,
            activePattern: /^\/menus/,
        },
        {
            name: 'Orders',
            href: '/orders',
            icon: ListOrdered,
            activePattern: /^\/orders/,
        },
        {
            name: 'QR Codes',
            href: '/qr-codes',
            icon: QrCode,
            activePattern: /^\/qr-codes/,
        },
        {
            name: 'Settings',
            href: '/settings',
            icon: Settings,
            activePattern: /^\/settings/,
        },
    ];

    const isActive = (pattern: RegExp) => {
        return pattern.test(pathname);
    };

    return (
        <div className="h-full">
            <nav className="p-6">
                <ul className="space-y-3">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.activePattern);

                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-300 font-medium ${
                                        active
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                >
                                    <Icon className="h-5 w-5 mr-3" />
                                    {item.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
};
