'use client';

import { LiveMenuEditor } from '@/features/menu';
import { useMenu, useUpdateMenu } from '@/hooks/menus/useMenus';
import { useRestaurants } from '@/hooks/restaurants/useRestaurants';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function EditMenuPage() {
    const router = useRouter();
    const params = useParams();
    const menuId = params.id as string;

    const {
        data: menu,
        isLoading: menuLoading,
        error: menuError,
    } = useMenu(menuId);
    const updateMutation = useUpdateMenu();
    const { data: restaurantsData } = useRestaurants();

    const restaurants = restaurantsData?.restaurants || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSave = async (menuData: any) => {
        try {
            await updateMutation.mutateAsync({
                id: menuId,
                data: menuData,
            });
            router.push('/menus');
        } catch (error) {
            // Error handled by mutation
        }
    };

    const handleCancel = () => {
        router.push('/menus');
    };

    // Loading state
    if (menuLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex items-center space-x-3">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    <span className="text-gray-600">Loading menu...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (menuError || !menu) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Menu not found
                        </h2>
                        <p className="text-gray-600">
                            The menu you&apos;re looking for doesn&apos;t exist
                            or has been deleted.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/menus')}
                        className="flex items-center justify-center mx-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Menus
                    </button>
                </div>
            </div>
        );
    }

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
                        Edit Menu: {menu.name}
                    </span>
                </div>
            </div>

            {/* Editor */}
            <LiveMenuEditor
                menu={menu}
                restaurants={restaurants}
                onSave={handleSave}
                onCancel={handleCancel}
                loading={updateMutation.isPending}
                mode="edit"
            />
        </div>
    );
}
