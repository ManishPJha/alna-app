'use client';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { MenuEditor } from '@/features/menu';
import { useMenuForm } from '@/hooks/menus/useMenuForm';
import { useMenu, useUpdateMenu } from '@/hooks/menus/useMenus';
import { useRestaurants } from '@/hooks/restaurants/useRestaurants';
import { MenuDataTransformer } from '@/service/menuDataTransformer';
import { Button } from '@/shared/components/ui/button';
import { MenuFormData } from '@/types/menu';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';

export default function EditMenuPage() {
    const router = useRouter();
    const params = useParams();
    const menuId = params.id as string;

    const {
        data: menuResponse,
        isLoading: menuLoading,
        error: menuError,
    } = useMenu(menuId);
    const updateMutation = useUpdateMenu();
    const { data: restaurantsData } = useRestaurants();
    const restaurants = restaurantsData?.restaurants || [];

    // Transform the API response to form data
    const transformedMenu = useMemo(() => {
        if (!menuResponse) return null;

        // Validate the API response structure (more lenient validation)
        if (!MenuDataTransformer.validateApiResponse(menuResponse)) {
            console.warn(
                'API response may have unexpected structure, attempting transformation anyway:',
                menuResponse
            );
        }

        const transformed = MenuDataTransformer.fromApiResponse(menuResponse);

        return transformed;
    }, [menuResponse]);

    // Pass the transformed data directly to useMenuForm
    const form = useMenuForm(transformedMenu, 'edit');

    const handleSave = async (data: MenuFormData) => {
        try {
            // Transform form data back to API format
            const apiData = MenuDataTransformer.toApiFormat(data);

            await updateMutation.mutateAsync({
                id: menuId,
                data: apiData,
            });
            router.push('/menus');
        } catch (error) {
            console.error('Failed to update menu:', error);
        }
    };

    const handleCancel = () => {
        router.push('/menus');
    };

    // Loading state
    if (menuLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
                    <p className="text-gray-600">Loading menu...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (menuError || !menuResponse) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Menu not found
                        </h2>
                        <p className="text-gray-600 mb-6">
                            The menu you&apos;re looking for doesn&apos;t exist
                            or has been deleted.
                        </p>
                        <Button
                            onClick={() => router.push('/menus')}
                            className="flex items-center justify-center mx-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Menus
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Data transformation error
    if (!transformedMenu) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Invalid Menu Data
                        </h2>
                        <p className="text-gray-600 mb-6">
                            The menu data could not be loaded properly. Please
                            check the browser console for details.
                        </p>
                        <div className="flex space-x-4 justify-center">
                            <Button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Retry
                            </Button>
                            <Button
                                onClick={() => router.push('/menus')}
                                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Menus
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
            <div className="h-screen bg-gray-50">
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <nav className="flex items-center space-x-4 text-sm">
                        <Button
                            onClick={() => router.push('/menus')}
                            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Menus
                        </Button>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-900 font-semibold">
                            Edit Menu: {transformedMenu.name}
                        </span>
                    </nav>
                </div>

                <MenuEditor
                    form={form}
                    restaurants={restaurants}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    loading={updateMutation.isPending}
                    mode="edit"
                />
            </div>
        </RoleGuard>
    );
}
