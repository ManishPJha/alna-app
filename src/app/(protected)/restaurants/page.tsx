/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
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
import { Input } from '@/components/ui/input';
import {
    useCreateRestaurant,
    useDeleteRestaurant,
    useRestaurants,
    useUpdateRestaurant,
    useUploadMenu,
} from '@/hooks/restaurants/useRestaurants';
import { Restaurant } from '@/types/api';
import { PaginationState, SortingState } from '@tanstack/react-table';
import { Plus, Search, Store } from 'lucide-react';
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
    const [searchQuery, setSearchQuery] = useState('');

    // Server-side pagination and sorting state
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([]);

    // Queries and mutations with server-side params
    const { data: restaurantsData, isLoading } = useRestaurants({
        page: pagination.pageIndex + 1, // Convert to 1-based
        limit: pagination.pageSize,
        search: searchQuery,
        sortBy: sorting[0]?.id as 'name' | 'createdAt' | 'updatedAt',
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
    });

    const createMutation = useCreateRestaurant();
    const updateMutation = useUpdateRestaurant();
    const deleteMutation = useDeleteRestaurant();
    const uploadMenuMutation = useUploadMenu();

    const restaurants = restaurantsData?.restaurants || [];
    const paginationInfo = restaurantsData?.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasMore: false,
    };

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

    // Handle server-side pagination changes
    const handlePaginationChange = (newPagination: PaginationState) => {
        setPagination(newPagination);
    };

    // Handle server-side sorting changes
    const handleSortingChange = (newSorting: SortingState) => {
        setSorting(newSorting);
        // Reset to first page when sorting changes
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    };

    // Handle search with debouncing (you might want to add debouncing)
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        // Reset to first page when searching
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    };

    return (
        <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
                <div className="space-y-8 p-8">
                    {/* Welcome Header with AdminDashboard Theme */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-600 rounded-2xl"></div>
                        <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">
                                        Restaurant Management
                                    </h1>
                                    <p className="text-indigo-100 text-lg">
                                        Manage your restaurant locations and
                                        digital presence with ALNA
                                    </p>
                                </div>
                                <div className="hidden md:block">
                                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                                        <Store className="h-12 w-12 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Actions Bar */}
                    <div className="flex items-center justify-between">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search restaurants..."
                                value={searchQuery}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            variant="default"
                            size="default"
                            className="bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Restaurant
                        </Button>
                    </div>

                    {/* Restaurants Table with Server-Side Pagination */}
                    <RestaurantsTable
                        data={restaurants}
                        loading={isLoading}
                        pagination={paginationInfo}
                        onEdit={setEditingRestaurant}
                        onDelete={setDeletingId}
                        onView={handleView}
                        onUploadMenu={setUploadingRestaurant}
                        onPaginationChange={handlePaginationChange}
                        onSortingChange={handleSortingChange}
                    />
                </div>

                {/* Create Dialog with Proper Theming */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
                        <DialogHeader className="bg-indigo-50 border-indigo-100">
                            <DialogTitle className="text-indigo-700">
                                Create New Restaurant
                            </DialogTitle>
                        </DialogHeader>
                        <div className="p-6 bg-white">
                            <RestaurantForm
                                onSubmit={handleCreate}
                                onCancel={() => setIsCreateOpen(false)}
                                loading={createMutation.isPending}
                            />
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog with Proper Theming */}
                <Dialog
                    open={!!editingRestaurant}
                    onOpenChange={() => setEditingRestaurant(null)}
                >
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
                        <DialogHeader className="bg-indigo-50 border-indigo-100">
                            <DialogTitle className="text-indigo-700">
                                Edit Restaurant
                            </DialogTitle>
                        </DialogHeader>
                        <div className="p-6 bg-white">
                            <RestaurantForm
                                restaurant={editingRestaurant || undefined}
                                onSubmit={handleUpdate}
                                onCancel={() => setEditingRestaurant(null)}
                                loading={updateMutation.isPending}
                            />
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation with Themed ConfirmDialog */}
                <ConfirmDialog
                    open={!!deletingId}
                    onOpenChange={() => setDeletingId(null)}
                    onConfirm={handleDelete}
                    title="Delete Restaurant"
                    description="Are you sure you want to delete this restaurant? This action cannot be undone and will remove all associated data including menus, QR codes, and customer access."
                    confirmText="Delete Restaurant"
                    cancelText="Cancel"
                    loading={deleteMutation.isPending}
                    destructive={true}
                />

                {/* Upload Menu Dialog with Theming */}
                <Dialog
                    open={!!uploadingRestaurant}
                    onOpenChange={() => setUploadingRestaurant(null)}
                >
                    <DialogContent className="bg-white text-gray-900">
                        <DialogHeader className="bg-indigo-50 border-indigo-100">
                            <DialogTitle className="text-indigo-700">
                                Upload Menu for {uploadingRestaurant?.name}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="p-6 bg-white">
                            <MenuUploadForm
                                onUpload={handleUploadMenu}
                                onCancel={() => setUploadingRestaurant(null)}
                                loading={uploadMenuMutation.isPending}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </RoleGuard>
    );
}
