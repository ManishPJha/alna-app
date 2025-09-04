'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/shared/utils';
import { Menu, QrCode, ShoppingCart, Store, Users } from 'lucide-react';
import { DashboardStatsProps } from '../types/dashboard';

export function DashboardStats({ stats, userRole }: DashboardStatsProps) {
    const statItems = [
        {
            title: 'Restaurants Onboarded',
            value: stats.restaurants,
            icon: Store,
            color: 'bg-blue-500',
        },
        ...(userRole === 'ADMIN'
            ? [
                  {
                      title: 'Total Managers',
                      value: stats.users,
                      icon: Users,
                      color: 'bg-green-500',
                  },
              ]
            : [
                  {
                      title: 'QR Codes Generated',
                      value: stats.qrCodes,
                      icon: QrCode,
                      color: 'bg-purple-500',
                  },
              ]),
        {
            title: 'Total Orders Placed By Users',
            value: stats.orders,
            icon: ShoppingCart,
            color: 'bg-purple-500',
        },
        {
            title: 'Total Published Menus',
            value: stats.activeMenus,
            icon: Menu,
            color: 'bg-orange-500',
        },
        // {
        //     title: 'Languages Translated',
        //     value: 42, // Placeholder, can be dynamic later
        //     icon: Languages,
        //     color: 'bg-pink-500',
        // },
        // {
        //     title: 'Customer Interactions',
        //     value: 186, // Placeholder, e.g., AI-powered Q&A or help requests
        //     icon: MessageSquare,
        //     color: 'bg-teal-500',
        // },
    ];

    return (
        <div
            className={cn(
                'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
            )}
        >
            {statItems.map((item, index) => (
                <Card key={index} className="border-0 shadow-md">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                    {item.title}
                                </p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {item.value.toLocaleString()}
                                </p>
                            </div>
                            <div className={`p-3 rounded-lg ${item.color}`}>
                                <item.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
