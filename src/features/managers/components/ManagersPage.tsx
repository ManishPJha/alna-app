'use client';

import { ManagerForm } from '@/components/forms/manager-form';
import { ManagersTable } from '@/components/tables/ManagersTable';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useRestaurantsSuspense } from '@/hooks/restaurants/useRestaurants';
import {
    useCreateUser,
    useDeleteUser,
    useUpdateUser,
    useUsersSuspense,
} from '@/hooks/users/useUsers';
import { User } from '@/types/api';
import { PaginationState, SortingState } from '@tanstack/react-table';
import { Plus, Search, Users as UsersIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function ManagersPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingManager, setEditingManager] = useState<User | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Server-side pagination and sorting state
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'createdAt', desc: true },
    ]);

    const session = useSession();

    const currentUser = session?.data?.user;

    // Queries and mutations with server-side params
    const { data: usersData, isLoading } = useUsersSuspense({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: searchQuery,
        sortBy: sorting[0]?.id as 'name' | 'email' | 'createdAt' | 'updatedAt',
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
    });

    // Get restaurants for the form dropdown
    const { data: restaurantsData } = useRestaurantsSuspense();

    const createMutation = useCreateUser();
    const updateMutation = useUpdateUser();
    const deleteMutation = useDeleteUser();

    const users = usersData?.users || [];
    const restaurants = restaurantsData?.restaurants || [];
    const paginationInfo = usersData?.pagination || {
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
            console.error('Error creating manager:', error);
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingManager) return;
        try {
            await updateMutation.mutateAsync({
                id: editingManager.id,
                data,
            });
            setEditingManager(null);
        } catch (error) {
            // Error handled by mutation
            console.error('Error updating manager:', error);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteMutation.mutateAsync(deletingId);
            setDeletingId(null);
        } catch (error) {
            // Error handled by mutation
            console.error('Error deleting manager:', error);
        }
    };

    const handlePaginationChange = (newPagination: PaginationState) => {
        setPagination(newPagination);
    };

    const handleSortingChange = (newSorting: SortingState) => {
        setSorting(newSorting);
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    };

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-600 rounded-2xl"></div>
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">
                                Manager Management
                            </h1>
                            <p className="text-indigo-100 text-lg">
                                Manage user accounts, permissions, and
                                restaurant assignments
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                                <UsersIcon className="h-12 w-12 text-white" />
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
                        placeholder="Search managers..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                {currentUser?.role === 'ADMIN' && (
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Manager
                    </Button>
                )}
            </div>

            {/* Managers Table */}
            <ManagersTable
                data={users}
                loading={isLoading}
                pagination={paginationInfo}
                restaurants={restaurants}
                onEdit={setEditingManager}
                onDelete={setDeletingId}
                onPaginationChange={handlePaginationChange}
                onSortingChange={handleSortingChange}
                currentUser={currentUser}
            />

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
                    <DialogHeader className="bg-indigo-50 border-indigo-100">
                        <DialogTitle className="text-indigo-700">
                            Create New Manager
                        </DialogTitle>
                    </DialogHeader>
                    <ManagerForm
                        restaurants={restaurants}
                        onSubmit={handleCreate}
                        onCancel={() => setIsCreateOpen(false)}
                        loading={createMutation.isPending}
                        currentUser={currentUser}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog
                open={!!editingManager}
                onOpenChange={() => setEditingManager(null)}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
                    <DialogHeader className="bg-indigo-50 border-indigo-100">
                        <DialogTitle className="text-indigo-700">
                            Edit Manager
                        </DialogTitle>
                    </DialogHeader>
                    <ManagerForm
                        manager={editingManager || undefined}
                        restaurants={restaurants}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingManager(null)}
                        loading={updateMutation.isPending}
                        currentUser={currentUser}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deletingId}
                onOpenChange={() => setDeletingId(null)}
                onConfirm={handleDelete}
                title="Delete Manager"
                description="Are you sure you want to delete this manager? This action cannot be undone and will remove their access to the system."
                confirmText="Delete Manager"
                cancelText="Cancel"
                loading={deleteMutation.isPending}
                destructive={true}
            />
        </div>
    );
}
