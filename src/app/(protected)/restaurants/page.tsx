/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { MenuUploadForm } from '@/components/forms/menu-upload-form';
import { RestaurantForm } from '@/components/forms/restaurant-form';
import { RestaurantsTable } from '@/components/tables/restaurants-table';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    useCreateRestaurant,
    useDeleteRestaurant,
    useRestaurants,
    useUpdateRestaurant,
    useUploadMenu,
} from '@/hooks/restaurants/useRestaurants';
import { Restaurant } from '@/types/api';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RestaurantsPage() {
    const router = useRouter();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingRestaurant, setEditingRestaurant] =
        useState<Restaurant | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [uploadingRestaurant, setUploadingRestaurant] =
        useState<Restaurant | null>(null);

    // Queries and mutations
    const { data: restaurantsData, isLoading } = useRestaurants();
    const createMutation = useCreateRestaurant();
    const updateMutation = useUpdateRestaurant();
    const deleteMutation = useDeleteRestaurant();
    const uploadMenuMutation = useUploadMenu();

    const restaurants = restaurantsData?.restaurants || [];

    // Event handlers
    const handleCreate = async (data: any) => {
        try {
            await createMutation.mutateAsync(data);
            setIsCreateOpen(false);
        } catch (error) {
            // Error handled by mutation
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingRestaurant) return;
        try {
            await updateMutation.mutateAsync({
                id: editingRestaurant.id,
                data,
            });
            setEditingRestaurant(null);
        } catch (error) {
            // Error handled by mutation
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteMutation.mutateAsync(deletingId);
            setDeletingId(null);
        } catch (error) {
            // Error handled by mutation
        }
    };

    const handleUploadMenu = async (file: File) => {
        if (!uploadingRestaurant) return;
        try {
            await uploadMenuMutation.mutateAsync({
                id: uploadingRestaurant.id,
                file,
            });
            setUploadingRestaurant(null);
        } catch (error) {
            // Error handled by mutation
        }
    };

    const handleView = (id: string) => {
        router.push(`/dashboard/restaurants/${id}`);
    };

    const handleGenerateQR = (id: string) => {
        router.push(`/dashboard/restaurants/${id}/qr-codes`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Restaurants
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage your restaurant locations and settings
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Restaurant
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <div className="w-6 h-6 bg-blue-600 rounded"></div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                Total Restaurants
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {restaurants.length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg border">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <div className="w-6 h-6 bg-green-600 rounded"></div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                Active Menus
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {
                                    restaurants.filter(
                                        (r) => (r.menuItemsCount || 0) > 0
                                    ).length
                                }
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg border">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <div className="w-6 h-6 bg-yellow-600 rounded"></div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                QR Codes
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {restaurants.reduce(
                                    (sum, r) => sum + (r.qrCodesCount || 0),
                                    0
                                )}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg border">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <div className="w-6 h-6 bg-purple-600 rounded"></div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                Managers
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {restaurants.reduce(
                                    (sum, r) => sum + (r.managersCount || 0),
                                    0
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Restaurants Table */}
            <div className="bg-white rounded-lg border">
                <RestaurantsTable
                    data={restaurants}
                    loading={isLoading}
                    onEdit={setEditingRestaurant}
                    onDelete={setDeletingId}
                    onView={handleView}
                    onGenerateQR={handleGenerateQR}
                    onUploadMenu={setUploadingRestaurant}
                />
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Restaurant</DialogTitle>
                    </DialogHeader>
                    <RestaurantForm
                        onSubmit={handleCreate}
                        onCancel={() => setIsCreateOpen(false)}
                        loading={createMutation.isPending}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog
                open={!!editingRestaurant}
                onOpenChange={() => setEditingRestaurant(null)}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Restaurant</DialogTitle>
                    </DialogHeader>
                    <RestaurantForm
                        restaurant={editingRestaurant || undefined}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingRestaurant(null)}
                        loading={updateMutation.isPending}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deletingId}
                onOpenChange={() => setDeletingId(null)}
                onConfirm={handleDelete}
                title="Delete Restaurant"
                description="Are you sure you want to delete this restaurant? This action cannot be undone and will remove all associated data."
                confirmText="Delete"
                loading={deleteMutation.isPending}
                destructive
            />

            {/* Upload Menu Dialog */}
            <Dialog
                open={!!uploadingRestaurant}
                onOpenChange={() => setUploadingRestaurant(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Upload Menu for {uploadingRestaurant?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <MenuUploadForm
                        onUpload={handleUploadMenu}
                        onCancel={() => setUploadingRestaurant(null)}
                        loading={uploadMenuMutation.isPending}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
