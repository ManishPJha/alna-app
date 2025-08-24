/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/shared/components/ui/button';
import { Menu, Restaurant } from '@/types/api';
import { formatDate } from '@/utils/formatter';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    PaginationState,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import {
    ChefHat,
    ChevronDown,
    ChevronUp,
    Copy,
    Edit,
    Eye,
    Palette,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
}

interface MenusTableProps {
    data: Menu[];
    loading: boolean;
    pagination: PaginationInfo;
    restaurants: Restaurant[];
    onEdit: (menu: Menu) => void;
    onView: (menu: Menu) => void;
    onDuplicate: (menu: Menu) => void;
    onDelete: (id: string) => void;
    onPaginationChange: (pagination: PaginationState) => void;
    onSortingChange: (sorting: SortingState) => void;
    currentUser?: any;
}

export function MenusTable({
    data,
    loading,
    pagination,
    restaurants,
    onEdit,
    onView,
    onDuplicate,
    onDelete,
    onPaginationChange,
    onSortingChange,
}: // currentUser,
MenusTableProps) {
    console.log(
        '%c [ data ]-49',
        'font-size:13px; background:#0db291; color:#51f6d5;',
        data
    );
    const [sorting, setSorting] = useState<SortingState>([]);

    // Handle sorting changes
    const handleSortingChange = (updaterOrValue: any) => {
        const newSorting =
            typeof updaterOrValue === 'function'
                ? updaterOrValue(sorting)
                : updaterOrValue;
        setSorting(newSorting);
        onSortingChange(newSorting);
    };

    // Handle pagination changes
    const handlePaginationChange = (updaterOrValue: any) => {
        const currentPagination = {
            pageIndex: pagination.page - 1,
            pageSize: pagination.limit,
        };

        const newPagination =
            typeof updaterOrValue === 'function'
                ? updaterOrValue(currentPagination)
                : updaterOrValue;

        onPaginationChange(newPagination);
    };

    // Helper function to get restaurant name
    const getRestaurantName = (restaurantId: string | null) => {
        if (!restaurantId) return 'Unassigned';
        const restaurant = restaurants.find((r) => r.id === restaurantId);
        return restaurant?.name || 'Unknown Restaurant';
    };

    // Helper function to count menu items
    const getItemCount = (menu: Menu) => {
        if (!menu.categories) return 0;
        return menu.categories.reduce(
            (total, category) => total + (category.items?.length || 0),
            0
        );
    };

    // Table columns with theme styling
    const columns = useMemo<ColumnDef<Menu>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Menu',
                cell: ({ row }) => (
                    <div className="flex items-center">
                        <div className="bg-indigo-100 rounded-lg p-2 mr-3">
                            <ChefHat className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-900">
                                {row.original.name}
                            </div>
                            <div className="text-sm text-gray-500">
                                {row.original.description || 'No description'}
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: 'restaurantId',
                header: 'Restaurant',
                cell: ({ row }) => (
                    <div className="text-sm font-medium text-gray-900">
                        {getRestaurantName(row.original.restaurantId || null)}
                    </div>
                ),
            },
            {
                accessorKey: 'categories',
                header: 'Categories',
                cell: ({ row }) => (
                    <div className="text-sm text-gray-500">
                        {row.original.categories?.length || 0} categories
                    </div>
                ),
            },
            {
                accessorKey: 'items',
                header: 'Items',
                cell: ({ row }) => (
                    <div className="text-sm text-gray-500">
                        {getItemCount(row.original)} items
                    </div>
                ),
            },
            {
                accessorKey: 'theme',
                header: 'Theme',
                cell: ({ row }) => (
                    <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                            <div
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{
                                    backgroundColor:
                                        row.original.theme?.primaryColor ||
                                        '#1f2937',
                                }}
                                title="Primary Color"
                            />
                            <div
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{
                                    backgroundColor:
                                        row.original.theme?.accentColor ||
                                        '#ef4444',
                                }}
                                title="Accent Color"
                            />
                            <div
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{
                                    backgroundColor:
                                        row.original.theme?.backgroundColor ||
                                        '#ffffff',
                                }}
                                title="Background Color"
                            />
                        </div>
                        <Palette className="w-3 h-3 text-gray-400" />
                    </div>
                ),
            },
            {
                accessorKey: 'isActive',
                header: 'Status',
                cell: ({ row }) => (
                    <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            row.original.isActive
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                    >
                        <div
                            className={`h-1.5 w-1.5 rounded-full mr-2 ${
                                row.original.isActive
                                    ? 'bg-green-500'
                                    : 'bg-red-500'
                            }`}
                        ></div>
                        {row.original.isActive ? 'Active' : 'Inactive'}
                    </span>
                ),
            },
            {
                accessorKey: 'createdAt',
                header: 'Created',
                cell: ({ row }) => (
                    <div className="text-sm text-gray-500">
                        {row.original.createdAt
                            ? formatDate(row.original.createdAt)
                            : 'N/A'}
                    </div>
                ),
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => onView(row.original)}
                            className="text-green-600 hover:text-green-900 transition-colors p-1 hover:bg-green-50 rounded"
                            title="Preview Menu"
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onEdit(row.original)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors p-1 hover:bg-indigo-50 rounded"
                            title="Edit Menu"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onDuplicate(row.original)}
                            className="text-blue-600 hover:text-blue-900 transition-colors p-1 hover:bg-blue-50 rounded"
                            title="Duplicate Menu"
                        >
                            <Copy className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onDelete(row.original.id)}
                            className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded"
                            title="Delete Menu"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [onEdit, onView, onDuplicate, onDelete, restaurants]
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true,
        manualSorting: true,
        pageCount: pagination.totalPages,
        onSortingChange: handleSortingChange,
        onPaginationChange: handlePaginationChange,
        state: {
            sorting,
            pagination: {
                pageIndex: pagination.page - 1,
                pageSize: pagination.limit,
            },
        },
    });

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Table Header */}
            <div className="bg-indigo-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">
                    All Menus ({pagination.total})
                </h3>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext()
                                                      )}
                                            </span>
                                            {{
                                                asc: (
                                                    <ChevronUp className="h-4 w-4" />
                                                ),
                                                desc: (
                                                    <ChevronDown className="h-4 w-4" />
                                                ),
                                            }[
                                                header.column.getIsSorted() as string
                                            ] ?? null}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-6 py-12 text-center"
                                >
                                    <div className="flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                                        <span className="text-gray-600">
                                            Loading menus...
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-6 py-12 text-center"
                                >
                                    <div className="text-gray-500">
                                        <ChefHat className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                        <p className="text-lg font-medium">
                                            No menus found
                                        </p>
                                        <p className="text-sm">
                                            Get started by creating your first
                                            menu
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row, index) => (
                                <tr
                                    key={row.id}
                                    className={`hover:bg-indigo-50 transition-colors ${
                                        index % 2 === 0
                                            ? 'bg-white'
                                            : 'bg-gray-50/50'
                                    }`}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className="px-6 py-4 whitespace-nowrap"
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Server-Side Pagination */}
            {pagination.total > 0 && (
                <div className="bg-white px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">
                                Showing{' '}
                                {(pagination.page - 1) * pagination.limit + 1}{' '}
                                to{' '}
                                {Math.min(
                                    pagination.page * pagination.limit,
                                    pagination.total
                                )}{' '}
                                of {pagination.total} results
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                onClick={() => table.previousPage()}
                                disabled={pagination.page <= 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </Button>
                            <span className="px-3 py-1 text-sm text-gray-700">
                                Page {pagination.page} of{' '}
                                {pagination.totalPages}
                            </span>
                            <Button
                                onClick={() => table.nextPage()}
                                disabled={!pagination.hasMore}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
