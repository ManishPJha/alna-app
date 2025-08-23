'use client';
import { MenuEditor } from '@/features/menu';
import { useMenuForm } from '@/hooks/menus/useMenuForm';
import { useCreateMenu } from '@/hooks/menus/useMenus';
import { useRestaurants } from '@/hooks/restaurants/useRestaurants';
import { MenuFormData } from '@/types/menu';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateMenuPage() {
    const router = useRouter();
    const createMutation = useCreateMenu();
    const { data: restaurantsData, isLoading: restaurantsLoading } =
        useRestaurants();
    const restaurants = restaurantsData?.restaurants || [];

    const form = useMenuForm(null, 'create');

    const handleSave = async (data: MenuFormData) => {
        try {
            await createMutation.mutateAsync(data);
            router.push('/menus');
        } catch (error) {
            console.error('Failed to create menu:', error);
            // You can add toast notification here
        }
    };

    const handleCancel = () => {
        router.push('/menus');
    };

    // Show loading state while restaurants are loading
    if (restaurantsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
                    <p className="text-gray-600">Loading restaurants...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <nav className="flex items-center space-x-4 text-sm">
                    <button
                        onClick={() => router.push('/menus')}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Menus
                    </button>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-900 font-semibold">
                        Create New Menu
                    </span>
                </nav>
            </div>

            <MenuEditor
                form={form}
                restaurants={restaurants}
                onSave={handleSave}
                onCancel={handleCancel}
                loading={createMutation.isPending}
                mode="create"
            />
        </div>
    );
}
