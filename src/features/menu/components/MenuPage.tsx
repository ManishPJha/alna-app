/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { MenusTable } from '@/components/tables/MenuTable';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import {
    useDeleteMenu,
    useDuplicateMenu,
    useMenus,
} from '@/hooks/menus/useMenus';
import { useRestaurants } from '@/hooks/restaurants/useRestaurants';
import { Menu } from '@/types/api';
import { PaginationState, SortingState } from '@tanstack/react-table';
import { ChefHat, Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface MenusPageProps {
    currentUser?: any;
}

export default function MenusPage({ currentUser }: MenusPageProps) {
    const router = useRouter();
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
    const [duplicateId, setDuplicateId] = useState<string | null>(null);

    // Queries and mutations with server-side params
    const { data: menusData, isLoading } = useMenus({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: searchQuery,
        sortBy: sorting[0]?.id as 'name' | 'createdAt' | 'updatedAt',
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
    });

    // Get restaurants for the menu creation
    const { data: restaurantsData } = useRestaurants();

    const deleteMutation = useDeleteMenu();
    const duplicateMenuMutation = useDuplicateMenu();

    const menus = menusData?.menus || [];
    const restaurants = restaurantsData?.restaurants || [];
    const paginationInfo = menusData?.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasMore: false,
    };

    // Event handlers
    const handleCreateMenu = () => {
        router.push('/menus/create');
    };

    const handleEditMenu = (menu: Menu) => {
        router.push(`/menus/${menu.id}/edit`);
    };

    const handleViewMenu = (menu: Menu) => {
        // Open in new tab for public view
        window.open(`/menu/${menu.id}`, '_blank');
    };

    const handleDuplicateMenu = async (menu: Menu) => {
        setDuplicateId(menu.id);
    };

    const handleDuplicateMenuConfirm = async () => {
        if (!duplicateId) return;
        try {
            const duplicateMenu = await duplicateMenuMutation.mutateAsync({
                id: duplicateId,
                data: {},
            });

            if (duplicateMenu.success) {
                router.push(`/menus/${duplicateMenu.data.id}/edit`);
                setDuplicateId(null);
            }
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
                                Menu Management
                            </h1>
                            <p className="text-indigo-100 text-lg">
                                Create and manage digital menus for your
                                restaurants
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                                <ChefHat className="h-12 w-12 text-white" />
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
                        placeholder="Search menus..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <Button
                    onClick={handleCreateMenu}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Menu
                </Button>
            </div>

            {/* Menus Table */}
            <MenusTable
                data={menus}
                loading={isLoading}
                pagination={paginationInfo}
                restaurants={restaurants}
                onEdit={handleEditMenu}
                onView={handleViewMenu}
                onDuplicate={handleDuplicateMenu}
                onDelete={setDeletingId}
                onPaginationChange={handlePaginationChange}
                onSortingChange={handleSortingChange}
                currentUser={currentUser}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deletingId}
                onOpenChange={() => setDeletingId(null)}
                onConfirm={handleDelete}
                title="Delete Menu"
                description="Are you sure you want to delete this menu? This action cannot be undone and will remove all menu items and categories."
                confirmText="Delete Menu"
                cancelText="Cancel"
                loading={deleteMutation.isPending}
                destructive={true}
            />

            <ConfirmDialog
                open={!!duplicateId}
                onOpenChange={() => setDuplicateId(null)}
                onConfirm={handleDuplicateMenuConfirm}
                title="Duplicate Menu"
                description="Are you sure you want to duplicate this menu? This action cannot be undone and will create a new menu with the same items and categories."
                confirmText="Duplicate Menu"
                cancelText="Cancel"
                loading={duplicateMenuMutation.isPending}
            />
        </div>
    );
}
