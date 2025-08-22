'use client';

import { Card, CardContent } from '@/components/ui/card';

export function HeaderSection() {
    return (
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Restaurants</h1>
                        <p className="text-blue-100 mb-4">
                            Manage your restaurant locations and settings
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
