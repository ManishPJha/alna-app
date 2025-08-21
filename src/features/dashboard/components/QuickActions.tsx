'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Plus, QrCode, Settings, Upload, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickActionsProps {
    userRole: string;
}

export function QuickActions({ userRole }: QuickActionsProps) {
    const router = useRouter();

    const actions = [
        {
            title: 'Add Restaurant',
            description: 'Create a new restaurant location',
            icon: Plus,
            onClick: () => router.push('/dashboard/restaurants?action=create'),
            color: 'bg-blue-500 hover:bg-blue-600',
        },
        {
            title: 'Generate QR Code',
            description: 'Create QR codes for tables',
            icon: QrCode,
            onClick: () => router.push('/dashboard/qr-codes?action=create'),
            color: 'bg-purple-500 hover:bg-purple-600',
        },
        {
            title: 'Upload Menu',
            description: 'Upload menu files',
            icon: Upload,
            onClick: () => router.push('/dashboard/restaurants?tab=menus'),
            color: 'bg-green-500 hover:bg-green-600',
        },
        ...(userRole === 'ADMIN'
            ? [
                  {
                      title: 'Manage Users',
                      description: 'Add or edit user accounts',
                      icon: Users,
                      onClick: () => router.push('/dashboard/users'),
                      color: 'bg-orange-500 hover:bg-orange-600',
                  },
              ]
            : []),
        {
            title: 'View Analytics',
            description: 'Check performance metrics',
            icon: BarChart3,
            onClick: () => router.push('/dashboard/analytics'),
            color: 'bg-indigo-500 hover:bg-indigo-600',
        },
        {
            title: 'Settings',
            description: 'Configure system settings',
            icon: Settings,
            onClick: () => router.push('/dashboard/settings'),
            color: 'bg-gray-500 hover:bg-gray-600',
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    Quick Actions
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {actions.map((action, index) => (
                    <Button
                        key={index}
                        onClick={action.onClick}
                        className={`w-full justify-start p-4 h-auto ${action.color} text-white`}
                    >
                        <action.icon className="h-5 w-5 mr-3" />
                        <div className="text-left">
                            <div className="font-semibold">{action.title}</div>
                            <div className="text-xs opacity-90">
                                {action.description}
                            </div>
                        </div>
                    </Button>
                ))}
            </CardContent>
        </Card>
    );
}
