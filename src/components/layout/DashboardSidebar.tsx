'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';
import {
    BarChart3,
    ChevronLeft,
    Home,
    Menu,
    QrCode,
    Settings,
    Store,
    Users,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navigation = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        description: 'Overview and analytics',
    },
    {
        name: 'Restaurants',
        href: '/restaurants',
        icon: Store,
        description: 'Manage locations',
    },
    {
        name: 'Users',
        href: '/users',
        icon: Users,
        description: 'User management',
        adminOnly: true,
    },
    {
        name: 'QR Codes',
        href: '/qr-codes',
        icon: QrCode,
        description: 'QR code management',
    },
    {
        name: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        description: 'Reports and insights',
    },
    {
        name: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'System settings',
    },
];

interface DashboardSidebarProps {
    userRole?: string;
}

export function DashboardSidebar({ userRole }: DashboardSidebarProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    const filteredNavigation = navigation.filter(
        (item) => !item.adminOnly || userRole === 'ADMIN'
    );

    return (
        <>
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/80 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            <div
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform lg:hidden',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex items-center justify-between h-16 px-6 border-b">
                    <h1 className="text-xl font-bold text-gray-900">
                        Admin Panel
                    </h1>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <SidebarContent
                    navigation={filteredNavigation}
                    pathname={pathname}
                    collapsed={false}
                />
            </div>

            {/* Desktop sidebar */}
            <div
                className={cn(
                    'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col bg-white border-r transition-all duration-300',
                    collapsed ? 'lg:w-16' : 'lg:w-64'
                )}
            >
                <div className="flex items-center justify-between h-16 px-6 border-b">
                    {!collapsed && (
                        <h1 className="text-xl font-bold text-gray-900">
                            Admin Panel
                        </h1>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex"
                    >
                        <ChevronLeft
                            className={cn(
                                'h-5 w-5 transition-transform',
                                collapsed && 'rotate-180'
                            )}
                        />
                    </Button>
                </div>
                <SidebarContent
                    navigation={filteredNavigation}
                    pathname={pathname}
                    collapsed={collapsed}
                />
            </div>

            {/* Mobile menu button */}
            <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(true)}
                >
                    <Menu className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold text-gray-900">
                    Dashboard
                </h1>
            </div>
        </>
    );
}

function SidebarContent({
    navigation,
    pathname,
    collapsed,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigation: any[];
    pathname: string;
    collapsed: boolean;
}) {
    return (
        <nav className="flex flex-1 flex-col overflow-y-auto py-4">
            <ul role="list" className="flex flex-1 flex-col gap-y-1 px-3">
                {navigation.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== '/dashboard' &&
                            pathname.startsWith(item.href));

                    return (
                        <li key={item.name}>
                            <Link
                                href={item.href}
                                className={cn(
                                    'group flex items-center gap-x-3 rounded-lg p-3 text-sm font-semibold transition-all hover:bg-gray-50',
                                    isActive
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'text-gray-700 hover:text-blue-600',
                                    collapsed && 'justify-center'
                                )}
                                title={collapsed ? item.name : undefined}
                            >
                                <item.icon
                                    className={cn(
                                        'h-5 w-5 shrink-0',
                                        isActive
                                            ? 'text-blue-600'
                                            : 'text-gray-400 group-hover:text-blue-600'
                                    )}
                                />
                                {!collapsed && (
                                    <div className="truncate">
                                        <div>{item.name}</div>
                                        <div className="text-xs text-gray-500 font-normal">
                                            {item.description}
                                        </div>
                                    </div>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
