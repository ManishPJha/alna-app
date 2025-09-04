'use client';

import { NavigationItem } from '@/types/layout';
import {
    ChevronDown,
    ChevronRight,
    History,
    ListOrdered,
    Menu,
    QrCode,
    Settings,
    ShoppingCart,
    Store,
    Users,
} from 'lucide-react';
import { Session } from 'next-auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export const DashboardSidebar = ({
    currentUser,
}: {
    currentUser?: Session['user'];
}) => {
    const pathname = usePathname();
    const [expandedItems, setExpandedItems] = useState<string[]>(['Orders']);

    const navigationItems: NavigationItem[] = [
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
                  } as NavigationItem,
                  {
                      name: 'Owners',
                      href: '/managers',
                      icon: Users,
                      activePattern: /^\/managers/,
                  } as NavigationItem,
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
            icon: ListOrdered,
            subItems: [
                {
                    name: 'Order Management',
                    href: '/orders',
                    icon: ShoppingCart,
                    activePattern: /^\/orders(?!\/history)/,
                },
                {
                    name: 'Order History',
                    href: '/orders/history',
                    icon: History,
                    activePattern: /^\/orders\/history/,
                },
            ],
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

    const isActive = (pattern?: RegExp) => {
        if (!pattern) return false;
        return pattern.test(pathname);
    };

    const isParentActive = (item: NavigationItem) => {
        if (item.activePattern && isActive(item.activePattern)) {
            return true;
        }

        if (item.subItems) {
            return item.subItems.some((subItem) =>
                isActive(subItem.activePattern)
            );
        }

        return false;
    };

    const toggleExpanded = (itemName: string) => {
        setExpandedItems((prev) =>
            prev.includes(itemName)
                ? prev.filter((name) => name !== itemName)
                : [...prev, itemName]
        );
    };

    const renderNavigationItem = (item: NavigationItem) => {
        const Icon = item.icon;
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isExpanded = expandedItems.includes(item.name);
        const parentActive = isParentActive(item);

        if (hasSubItems) {
            return (
                <li key={item.name}>
                    {/* Parent item with expand/collapse */}
                    <button
                        onClick={() => toggleExpanded(item.name)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-xl transition-all duration-300 font-medium ${
                            parentActive
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                        <div className="flex items-center">
                            <Icon className="h-5 w-5 mr-3" />
                            {item.name}
                        </div>
                        {isExpanded ? (
                            <ChevronDown
                                className={`h-4 w-4 transition-transform duration-200 ${
                                    parentActive
                                        ? 'text-white'
                                        : 'text-gray-400'
                                }`}
                            />
                        ) : (
                            <ChevronRight
                                className={`h-4 w-4 transition-transform duration-200 ${
                                    parentActive
                                        ? 'text-white'
                                        : 'text-gray-400'
                                }`}
                            />
                        )}
                    </button>

                    {/* Submenu items with smooth animation */}
                    <div
                        className={`mt-2 space-y-1 transition-all duration-300 ease-in-out ${
                            isExpanded
                                ? 'max-h-96 opacity-100'
                                : 'max-h-0 opacity-0 overflow-hidden'
                        }`}
                    >
                        {item.subItems?.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const subActive = isActive(subItem.activePattern);

                            return (
                                <Link
                                    key={subItem.name}
                                    href={subItem.href}
                                    className={`flex items-center px-4 py-2.5 ml-4 text-sm rounded-lg transition-all duration-200 font-medium ${
                                        subActive
                                            ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 shadow-sm'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 border-l-4 border-transparent hover:border-gray-300'
                                    }`}
                                >
                                    <SubIcon
                                        className={`h-4 w-4 mr-3 ${
                                            subActive
                                                ? 'text-indigo-600'
                                                : 'text-gray-400'
                                        }`}
                                    />
                                    {subItem.name}
                                </Link>
                            );
                        })}
                    </div>
                </li>
            );
        }

        // Regular navigation item without submenus
        return (
            <li key={item.name}>
                <Link
                    href={item.href!}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-300 font-medium ${
                        isActive(item.activePattern)
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-[1.02]'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                </Link>
            </li>
        );
    };

    return (
        <div className="h-full bg-white">
            <nav className="p-6">
                <ul className="space-y-2">
                    {navigationItems.map(renderNavigationItem)}
                </ul>
            </nav>
        </div>
    );
};
