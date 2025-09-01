/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useMenus } from '@/hooks/menus/useMenus';
import { useRestaurants } from '@/hooks/restaurants/useRestaurants';
import {
    Menu,
    QrCode as QrIcon,
    RefreshCw,
    Store
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { QRCodeTable } from '../../../components/tables/QRCodeTable';
import { QRCodeDeleteDialog } from './QRCodeDeleteDialog';
import { QRCodeForm } from './QRCodeForm';
import { QRCodePreview } from './QRCodePreview';

interface QRCodesPageProps {
    currentUser?: any;
}

export default function QRCodesPage({ currentUser }: QRCodesPageProps) {
    const isAdmin = currentUser?.role === 'ADMIN';
    const userRestaurantId = currentUser?.restaurantId;

    // Restaurant and menu search + selector
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRestaurantId, setSelectedRestaurantId] =
        useState<string>('');
    const [selectedMenuId, setSelectedMenuId] = useState<string>('');

    // Restaurant data (only for admins or paginated loading)
    const [restaurantPage, setRestaurantPage] = useState(1);
    const [allRestaurants, setAllRestaurants] = useState<any[]>([]);
    const [hasMoreRestaurants, setHasMoreRestaurants] = useState(true);

    const { data: restaurantsData, isLoading: restaurantsLoading } =
        useRestaurants({
            page: isAdmin ? restaurantPage : 1,
            limit: 10,
            search: isAdmin ? searchQuery : undefined,
            // For managers, don't fetch all restaurants
            ...(isAdmin ? {} : { restaurantId: userRestaurantId }),
        });

    // Menu data based on selected restaurant
    const { data: menusData, isLoading: menusLoading } = useMenus({
        restaurantId: selectedRestaurantId || userRestaurantId,
        page: 1,
        limit: 10,
    });

    // QR state
    const [qrCodes, setQrCodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [newTable, setNewTable] = useState('');
    const [creating, setCreating] = useState(false);

    const [bulkTotal, setBulkTotal] = useState<string>('');
    const [bulkLoading, setBulkLoading] = useState(false);

    const [preview, setPreview] = useState<{
        token: string;
        table?: string;
    } | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Handle restaurant pagination for admin
    useEffect(() => {
        if (isAdmin && restaurantsData?.restaurants) {
            if (restaurantPage === 1) {
                setAllRestaurants(restaurantsData.restaurants);
            } else {
                setAllRestaurants((prev) => [
                    ...prev,
                    ...restaurantsData.restaurants,
                ]);
            }
            setHasMoreRestaurants(restaurantsData.pagination?.hasMore || false);
        }
    }, [restaurantsData, restaurantPage, isAdmin]);

    // Handle restaurant selection
    useEffect(() => {
        if (!isAdmin && userRestaurantId) {
            setSelectedRestaurantId(userRestaurantId);
        } else if (
            isAdmin &&
            allRestaurants.length > 0 &&
            !selectedRestaurantId
        ) {
            setSelectedRestaurantId(allRestaurants[0].id);
        }
    }, [allRestaurants, selectedRestaurantId, isAdmin, userRestaurantId]);

    // Handle menu selection
    useEffect(() => {
        if (menusData && menusData.menus?.length > 0 && !selectedMenuId) {
            setSelectedMenuId(menusData.menus[0].id);
        }
    }, [menusData, selectedMenuId]);

    const fetchQrCodes = useCallback(async () => {
        if (!selectedMenuId) return;
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams({
                menuId: selectedMenuId,
            });
            const res = await fetch(`/api/qrcodes?${qs.toString()}`, {
                cache: 'no-store',
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to load QR codes');
            setQrCodes(data.qrCodes || []);
        } catch (e: any) {
            setError(e?.message || 'Failed to load QR codes');
        } finally {
            setLoading(false);
        }
    }, [selectedMenuId]);

    useEffect(() => {
        fetchQrCodes();
    }, [fetchQrCodes]);

    const createQrCode = async () => {
        if (!newTable.trim() || !selectedMenuId) return;
        setCreating(true);
        try {
            const res = await fetch('/api/qrcodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    menuId: selectedMenuId,
                    tableNumber: newTable.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to create QR');
            setNewTable('');
            fetchQrCodes();
        } catch (e: any) {
            alert(e?.message || 'Failed to create QR');
        } finally {
            setCreating(false);
        }
    };

    const bulkGenerate = async () => {
        const n = Number(bulkTotal);
        if (!Number.isFinite(n) || n < 1)
            return alert('Enter total tables (1–25)');
        if (n > 25) return alert('Max 25 tables allowed');
        setBulkLoading(true);
        try {
            const res = await fetch('/api/qrcodes/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    menuId: selectedMenuId,
                    totalTables: n,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to generate');
            setBulkTotal('');
            fetchQrCodes();
        } catch (e: any) {
            alert(e?.message || 'Failed to generate');
        } finally {
            setBulkLoading(false);
        }
    };

    const deleteQr = async (id: string) => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/qrcodes/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to delete');
            setQrCodes((prev) => prev.filter((q) => q.id !== id));
            setDeleteTarget(null);
        } catch (e: any) {
            alert(e?.message || 'Failed to delete');
        } finally {
            setDeleting(false);
        }
    };

    const copyLink = async (qrToken: string) => {
        const menuId = selectedMenuId;
        const url = `${window.location.origin}/menu/${menuId}?qr=${qrToken}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Link copied');
        } catch {
            toast.error('Failed to copy link');
        }
    };

    const downloadPNG = (qrToken: string, table?: string) => {
        const containerId = `hub-qr-svg-${qrToken}`;
        const svg = document.getElementById(
            containerId
        ) as SVGSVGElement | null;
        if (!svg) return alert('QR not ready');

        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        const svgBlob = new Blob([svgData], {
            type: 'image/svg+xml;charset=utf-8',
        });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            const padding = 80;
            const scale = 3; // Scale up the QR code by 3x
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const size = Math.max(scaledWidth, scaledHeight) + padding * 2;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // draw QR centered and scaled up
            const x = (size - scaledWidth) / 2;
            const y = (size - scaledHeight) / 2;
            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

            const png = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = png;
            a.download = `qr_table_${table || 'unknown'}.png`;
            a.click();

            URL.revokeObjectURL(url);
        };

        img.src = url;
    };

    const loadMoreRestaurants = () => {
        if (isAdmin && hasMoreRestaurants && !restaurantsLoading) {
            setRestaurantPage((prev) => prev + 1);
        }
    };

    const currentRestaurants = isAdmin
        ? allRestaurants
        : restaurantsData?.restaurants || [];
    const currentMenus = menusData?.menus || [];

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-600 rounded-2xl" />
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">
                                QR Codes
                            </h1>
                            <p className="text-indigo-100 text-lg">
                                {isAdmin
                                    ? 'Select a restaurant and menu to manage QR codes'
                                    : 'Select a menu to manage QR codes'}
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

            {/* Restaurant and Menu selector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Restaurant Selection (Admin Only) */}
                    {isAdmin && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Search restaurants
                                </label>
                                <div className="relative">
                                    <Input
                                        placeholder="Search restaurants..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Restaurant
                                </label>
                                <Select
                                    value={selectedRestaurantId}
                                    onValueChange={setSelectedRestaurantId}
                                >
                                    <SelectTrigger className="w-full bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                        <SelectValue
                                            placeholder={
                                                restaurantsLoading
                                                    ? 'Loading...'
                                                    : 'Select restaurant'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white text-gray-900 border border-gray-200 max-h-60 overflow-y-auto">
                                        {currentRestaurants.map((r: any) => (
                                            <SelectItem key={r.id} value={r.id}>
                                                {r.name}
                                            </SelectItem>
                                        ))}
                                        {hasMoreRestaurants && (
                                            <div className="p-2 border-t">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={
                                                        loadMoreRestaurants
                                                    }
                                                    disabled={
                                                        restaurantsLoading
                                                    }
                                                    className="w-full"
                                                >
                                                    {restaurantsLoading
                                                        ? 'Loading...'
                                                        : 'Load More'}
                                                </Button>
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Menu Selection */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Menu
                            </label>
                            <div className="relative">
                                <Select
                                    value={selectedMenuId}
                                    onValueChange={setSelectedMenuId}
                                >
                                    <SelectTrigger className="w-full bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                        <SelectValue
                                            placeholder={
                                                menusLoading
                                                    ? 'Loading menus...'
                                                    : 'Select menu'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white text-gray-900 border border-gray-200">
                                        {currentMenus.map((m: any) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                <div className="flex items-center space-x-2">
                                                    <Menu className="h-4 w-4" />
                                                    <span>{m.name}</span>
                                                    {!m.isPublished && (
                                                        <span className="text-xs text-amber-600">
                                                            (Draft)
                                                        </span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Menu className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <Button
                                onClick={fetchQrCodes}
                                disabled={loading || !selectedMenuId}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                <RefreshCw
                                    className={`w-4 h-4 mr-2 ${
                                        loading ? 'animate-spin' : ''
                                    }`}
                                />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Code Form */}
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
