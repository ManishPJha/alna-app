'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Restaurant } from '@/types/api';
import { formatDate } from '@/utils/formatter';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Eye, MoreHorizontal, QrCode, Trash, Upload } from 'lucide-react';

interface RestaurantsTableProps {
    data: Restaurant[];
    loading?: boolean;
    onEdit?: (restaurant: Restaurant) => void;
    onDelete?: (id: string) => void;
    onView?: (id: string) => void;
    onGenerateQR?: (id: string) => void;
    onUploadMenu?: (restaurant: Restaurant) => void;
}

export function RestaurantsTable({
    data,
    loading,
    onEdit,
    onDelete,
    onView,
    onGenerateQR,
    onUploadMenu,
}: RestaurantsTableProps) {
    const columns: ColumnDef<Restaurant>[] = [
        {
            accessorKey: 'name',
            header: 'Restaurant',
            cell: ({ row }) => {
                const restaurant = row.original;
                return (
                    <div className="flex items-center space-x-3">
                        {restaurant.logoUrl ? (
                            <img
                                src={restaurant.logoUrl}
                                alt={restaurant.name}
                                className="h-10 w-10 rounded-full object-cover"
                            />
                        ) : (
                            <div
                                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                                style={{
                                    backgroundColor: restaurant.themeColor,
                                }}
                            >
                                {restaurant.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <div className="font-semibold text-gray-900">
                                {restaurant.name}
                            </div>
                            <div className="text-sm text-gray-500">
                                {restaurant.email}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'address',
            header: 'Address',
            cell: ({ row }) => {
                const address = row.getValue('address') as string;
                return (
                    <div className="max-w-[200px] truncate">
                        {address || (
                            <span className="text-gray-400">No address</span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'managersCount',
            header: 'Managers',
            cell: ({ row }) => {
                const count = row.getValue('managersCount') as number;
                return (
                    <Badge variant={count > 0 ? 'default' : 'secondary'}>
                        {count || 0}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'qrCodesCount',
            header: 'QR Codes',
            cell: ({ row }) => {
                const count = row.getValue('qrCodesCount') as number;
                return (
                    <Badge variant={count > 0 ? 'default' : 'outline'}>
                        {count || 0}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'menuItemsCount',
            header: 'Menu Items',
            cell: ({ row }) => {
                const count = row.getValue('menuItemsCount') as number;
                return (
                    <Badge variant={count > 0 ? 'default' : 'outline'}>
                        {count || 0}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'createdAt',
            header: 'Created',
            cell: ({ row }) => {
                const date = row.getValue('createdAt') as string;
                return (
                    <div className="text-sm text-gray-500">
                        {formatDate(date)}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const restaurant = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => onView?.(restaurant.id)}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onEdit?.(restaurant)}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onUploadMenu?.(restaurant)}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Menu
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onGenerateQR?.(restaurant.id)}
                            >
                                <QrCode className="mr-2 h-4 w-4" />
                                Generate QR
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete?.(restaurant.id)}
                                className="text-red-600"
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={data}
            loading={loading}
            searchKey="name"
            searchPlaceholder="Search restaurants..."
            onRowClick={(restaurant) => onView?.(restaurant.id)}
        />
    );
}
