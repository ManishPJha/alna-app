'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WelcomeSectionProps {
    user: {
        name?: string | null;
        role: string;
    };
}

export function WelcomeSection({ user }: WelcomeSectionProps) {
    const router = useRouter();
    const currentHour = new Date().getHours();

    const getGreeting = () => {
        if (currentHour < 12) return 'Good morning';
        if (currentHour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">
                            {getGreeting()}, {user.name || 'Welcome'}! 👋
                        </h1>
                        <p className="text-blue-100 mb-4">
                            {user.role === 'ADMIN'
                                ? 'Manage your entire restaurant network from here.'
                                : 'Manage your restaurant operations efficiently.'}
                        </p>
                        <div className="flex space-x-3">
                            <Button
                                onClick={() => router.push('/restaurants')}
                                className="bg-white text-blue-600 hover:bg-blue-50"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Restaurant
                            </Button>
                            <Button
                                onClick={() => router.push('/settings')}
                                variant="outline"
                                className="text-white hover:bg-white bg-transparent hover:text-blue-600"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </Button>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="text-right">
                            <p className="text-sm text-blue-100">
                                Today&apos;s Date
                            </p>
                            <p className="text-lg font-semibold">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
