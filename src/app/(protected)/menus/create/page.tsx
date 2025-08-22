/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { LiveMenuEditor } from '@/features/menu';
import { useCreateMenu } from '@/hooks/menus/useMenus';
import { useRestaurants } from '@/hooks/restaurants/useRestaurants';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateMenuPage() {
    const router = useRouter();
    const createMutation = useCreateMenu();
    const { data: restaurantsData } = useRestaurants();

    const restaurants = restaurantsData?.restaurants || [];

    const handleSave = async (menuData: any) => {
        try {
            await createMutation.mutateAsync(menuData);
            router.push('/menus');
        } catch (error) {
            // Error handled by mutation
        }
    };

    const handleCancel = () => {
        router.push('/menus');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb Navigation */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.push('/menus')}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Menus
                    </button>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-900 font-semibold">
                        Create New Menu
                    </span>
                </div>
            </div>

            {/* Editor */}
            <LiveMenuEditor
                menu={null}
                restaurants={restaurants}
                onSave={handleSave}
                onCancel={handleCancel}
                loading={createMutation.isPending}
                mode="create"
            />
        </div>
    );
}
