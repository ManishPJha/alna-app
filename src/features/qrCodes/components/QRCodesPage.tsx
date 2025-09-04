'use client';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useSuspenseMenus } from '@/hooks/menus/useMenus';
import { useRestaurantsSuspense } from '@/hooks/restaurants/useRestaurants';
import { Menu, QrCode as QrIcon, RefreshCw } from 'lucide-react';
import { Session } from 'next-auth';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { QRCodeTable } from '../../../components/tables/QRCodeTable';
import { QRCodeDeleteDialog } from './QRCodeDeleteDialog';
import { QRCodeForm } from './QRCodeForm';
import { QRCodePreview } from './QRCodePreview';

interface QRCodesPageProps {
    currentUser?: Session['user'];
}

// Constants for better maintainability
const PAGINATION_LIMIT = 10;
const MAX_BULK_TABLES = 25;

export default function QRCodesPage({ currentUser }: QRCodesPageProps) {
    const isAdmin = currentUser?.role === 'ADMIN';
    const userRestaurantId = currentUser?.restaurantId;

    // State management
    const [selectedRestaurantId, setSelectedRestaurantId] =
        useState<string>('');
    const [selectedMenuId, setSelectedMenuId] = useState<string>('');
    const [qrCodes, setQrCodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [newTable, setNewTable] = useState('');
    const [creating, setCreating] = useState(false);
    const [bulkTotal, setBulkTotal] = useState<string>('');
    const [bulkLoading, setBulkLoading] = useState(false);

    // Modal states
    const [preview, setPreview] = useState<{
        token: string;
        table?: string;
    } | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Restaurant data query
    const { data: restaurantsData, isLoading: restaurantsLoading } =
        useRestaurantsSuspense({
            page: 1,
            limit: isAdmin ? 50 : PAGINATION_LIMIT,
            search: '',
            ...(isAdmin ? {} : { restaurantId: userRestaurantId }),
        });

    const restaurants = useMemo(
        () => restaurantsData?.restaurants || [],
        [restaurantsData]
    );

    const menuRestaurantId =
        selectedRestaurantId ||
        userRestaurantId ||
        (restaurants.length > 0 ? restaurants[0].id : '');

    // Menu data query - depends on selected restaurant
    const { data: menusData, isLoading: menusLoading } = useSuspenseMenus({
        restaurantId: menuRestaurantId,
        page: 1,
        limit: PAGINATION_LIMIT,
    });

    const menus = useMemo(() => menusData?.menus || [], [menusData]);

    // Initialize restaurant selection
    useEffect(() => {
        if (!selectedRestaurantId) {
            if (!isAdmin && userRestaurantId) {
                // Manager: auto-select their restaurant
                setSelectedRestaurantId(userRestaurantId);
            } else if (isAdmin && restaurants.length > 0) {
                // Admin: auto-select first restaurant
                setSelectedRestaurantId(restaurants[0].id);
            }
        }
    }, [restaurants, selectedRestaurantId, isAdmin, userRestaurantId]);

    // Handle menu initialization and updates when restaurant changes
    useEffect(() => {
        if (selectedRestaurantId) {
            // Reset menu selection when restaurant changes
            setSelectedMenuId('');
        } else {
            setSelectedMenuId('');
            setQrCodes([]);
        }
    }, [selectedRestaurantId]);

    // Auto-select menu when menus data is loaded
    useEffect(() => {
        if (menus.length > 0 && !selectedMenuId) {
            // Prioritize published menus, fall back to first menu
            const publishedMenu = menus.find((menu) => menu.isPublished);
            const defaultMenu = publishedMenu || menus[0];
            setSelectedMenuId(defaultMenu.id);
        }
    }, [menus, selectedMenuId]);

    // Fetch QR codes when menu changes
    const fetchQrCodes = useCallback(async () => {
        if (!selectedMenuId) {
            setQrCodes([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/qrcodes?menuId=${selectedMenuId}`,
                {
                    cache: 'no-store',
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.error || 'Failed to load QR codes');
            }

            const data = await response.json();
            setQrCodes(data.qrCodes || []);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to load QR codes';
            setError(errorMessage);
            setQrCodes([]);
            console.error('Error fetching QR codes:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedMenuId]);

    // Fetch QR codes when selectedMenuId changes
    useEffect(() => {
        fetchQrCodes();
    }, [fetchQrCodes]);

    // Restaurant change handler
    const handleRestaurantChange = useCallback((restaurantId: string) => {
        setSelectedRestaurantId(restaurantId);
        // Menu and QR codes will be reset in useEffect hooks
    }, []);

    // Menu change handler
    const handleMenuChange = useCallback((menuId: string) => {
        setSelectedMenuId(menuId);
        // QR codes will be fetched in useEffect hook
    }, []);

    // Create single QR code
    const createQrCode = useCallback(async () => {
        const tableNumber = newTable.trim();
        if (!tableNumber || !selectedMenuId) {
            toast.error(
                'Please enter a table number and ensure a menu is selected'
            );
            return;
        }

        setCreating(true);
        try {
            const response = await fetch('/api/qrcodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    menuId: selectedMenuId,
                    tableNumber,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.error || 'Failed to create QR code');
            }

            setNewTable('');
            await fetchQrCodes(); // Refresh QR codes list
            toast.success(`QR code created for table ${tableNumber}`);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to create QR code';
            toast.error(errorMessage);
        } finally {
            setCreating(false);
        }
    }, [newTable, selectedMenuId, fetchQrCodes]);

    // Bulk generate QR codes
    const bulkGenerate = useCallback(async () => {
        const totalTables = Number(bulkTotal);

        if (!Number.isFinite(totalTables) || totalTables < 1) {
            toast.error('Please enter a valid number of tables (1 or more)');
            return;
        }

        if (totalTables > MAX_BULK_TABLES) {
            toast.error(
                `Maximum ${MAX_BULK_TABLES} tables allowed for bulk generation`
            );
            return;
        }

        if (!selectedMenuId) {
            toast.error('Please select a menu first');
            return;
        }

        setBulkLoading(true);
        try {
            const response = await fetch('/api/qrcodes/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    menuId: selectedMenuId,
                    totalTables,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData?.error || 'Failed to generate QR codes'
                );
            }

            setBulkTotal('');
            await fetchQrCodes(); // Refresh QR codes list
            toast.success(`Successfully generated ${totalTables} QR codes`);
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to generate QR codes';
            toast.error(errorMessage);
        } finally {
            setBulkLoading(false);
        }
    }, [bulkTotal, selectedMenuId, fetchQrCodes]);

    // Delete QR code
    const deleteQr = useCallback(async (id: string) => {
        setDeleting(true);
        try {
            const response = await fetch(`/api/qrcodes/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.error || 'Failed to delete QR code');
            }

            // Update local state immediately for better UX
            setQrCodes((prev) => prev.filter((qr) => qr.id !== id));
            setDeleteTarget(null);
            toast.success('QR code deleted successfully');
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to delete QR code';
            toast.error(errorMessage);
        } finally {
            setDeleting(false);
        }
    }, []);

    // Copy QR code link
    const copyLink = useCallback(
        async (qrToken: string) => {
            if (!selectedMenuId) {
                toast.error('No menu selected');
                return;
            }

            const url = `${window.location.origin}/menu/${selectedMenuId}?qr=${qrToken}`;

            try {
                await navigator.clipboard.writeText(url);
                toast.success('QR code link copied to clipboard');
            } catch (err) {
                console.error('Failed to copy link:', err);
                toast.error('Failed to copy link to clipboard');
            }
        },
        [selectedMenuId]
    );

    // Download QR code as PNG
    const downloadPNG = useCallback((qrToken: string, table?: string) => {
        const containerId = `hub-qr-svg-${qrToken}`;
        const svg = document.getElementById(
            containerId
        ) as SVGSVGElement | null;

        if (!svg) {
            toast.error('QR code not ready for download');
            return;
        }

        try {
            const svgData = new XMLSerializer().serializeToString(svg);
            const img = new Image();
            const svgBlob = new Blob([svgData], {
                type: 'image/svg+xml;charset=utf-8',
            });
            const url = URL.createObjectURL(svgBlob);

            img.onload = () => {
                const padding = 80;
                const scale = 3;
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const size = Math.max(scaledWidth, scaledHeight) + padding * 2;

                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    toast.error('Failed to create download canvas');
                    return;
                }

                // White background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw QR code centered and scaled
                const x = (size - scaledWidth) / 2;
                const y = (size - scaledHeight) / 2;
                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

                // Download
                const png = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = png;
                downloadLink.download = `qr_table_${table || 'unknown'}.png`;
                downloadLink.click();

                URL.revokeObjectURL(url);
                toast.success(`QR code downloaded for table ${table}`);
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                toast.error('Failed to process QR code for download');
            };

            img.src = url;
        } catch (err) {
            console.error('Download error:', err);
            toast.error('Failed to download QR code');
        }
    }, []);

    // Get current selections for display
    const selectedRestaurant = restaurants.find(
        (r) => r.id === selectedRestaurantId
    );
    const selectedMenu = menus.find((m) => m.id === selectedMenuId);

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl" />
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">
                                QR Code Management
                            </h1>
                            <p className="text-indigo-100 text-lg">
                                {isAdmin
                                    ? 'Select a restaurant and menu to manage QR codes'
                                    : 'Select a menu to manage your QR codes'}
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                                <QrIcon className="h-12 w-12 text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selection Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Restaurant Selection (Admin Only) */}
                    {isAdmin && (
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Restaurant
                            </label>
                            <Select
                                value={selectedRestaurantId}
                                onValueChange={handleRestaurantChange}
                                disabled={restaurantsLoading}
                            >
                                <SelectTrigger className="w-full bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                    <SelectValue
                                        placeholder={
                                            restaurantsLoading
                                                ? 'Loading restaurants...'
                                                : 'Select restaurant'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-200">
                                    {restaurants.map((restaurant) => (
                                        <SelectItem
                                            key={restaurant.id}
                                            value={restaurant.id}
                                        >
                                            {restaurant.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedRestaurant && (
                                <p className="text-xs text-gray-500">
                                    Selected: {selectedRestaurant.name}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Menu Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Menu
                        </label>
                        <div className="flex gap-2">
                            <Select
                                value={selectedMenuId}
                                onValueChange={handleMenuChange}
                                disabled={menusLoading || !selectedRestaurantId}
                            >
                                <SelectTrigger className="flex-1 bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                    <SelectValue
                                        placeholder={
                                            menusLoading
                                                ? 'Loading menus...'
                                                : !selectedRestaurantId
                                                ? 'Select restaurant first'
                                                : menus.length === 0
                                                ? 'No menus available'
                                                : 'Select menu'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-200">
                                    {menus.map((menu) => (
                                        <SelectItem
                                            key={menu.id}
                                            value={menu.id}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <Menu className="h-4 w-4" />
                                                <span>{menu.name}</span>
                                                {!menu.isPublished && (
                                                    <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                                                        Draft
                                                    </span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={fetchQrCodes}
                                disabled={loading || !selectedMenuId}
                                variant="outline"
                                size="default"
                            >
                                <RefreshCw
                                    className={`w-4 h-4 ${
                                        loading ? 'animate-spin' : ''
                                    }`}
                                />
                            </Button>
                        </div>
                        {selectedMenu && (
                            <p className="text-xs text-gray-500">
                                Selected: {selectedMenu.name}
                                {!selectedMenu.isPublished && ' (Draft)'}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* QR Code Form */}
            {selectedMenuId && (
                <QRCodeForm
                    newTable={newTable}
                    setNewTable={setNewTable}
                    bulkTotal={bulkTotal}
                    setBulkTotal={setBulkTotal}
                    creating={creating}
                    bulkLoading={bulkLoading}
                    selectedMenuId={selectedMenuId}
                    onCreateQrCode={createQrCode}
                    onBulkGenerate={bulkGenerate}
                />
            )}

            {/* QR Code Table */}
            <QRCodeTable
                qrCodes={qrCodes}
                loading={loading}
                error={error}
                selectedMenuId={selectedMenuId}
                selectedRestaurantId={selectedRestaurantId}
                onPreview={setPreview}
                onDownload={downloadPNG}
                onDelete={setDeleteTarget}
            />

            {/* Preview Modal */}
            <QRCodePreview
                preview={preview}
                selectedMenuId={selectedMenuId}
                onClose={() => setPreview(null)}
                onDownload={downloadPNG}
            />

            {/* Delete Confirmation Modal */}
            <QRCodeDeleteDialog
                deleteTarget={deleteTarget}
                deleting={deleting}
                onClose={() => setDeleteTarget(null)}
                onDelete={deleteQr}
            />
        </div>
    );
}
