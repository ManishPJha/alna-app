'use client';

import {
    bulkCreateQRCodes,
    createQRCode,
    deleteQRCode,
    getQRCodes,
    getQRCodeStats,
    toggleQRCodeStatus,
    updateQRCode,
    type QRCodeData
} from '@/features/qrCodes';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// Hook for managing QR codes with server actions
export function useQRActions() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get QR codes
    const fetchQRCodes = useCallback(async (
        restaurantId: string,
        menuId?: string
    ): Promise<QRCodeData[]> => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await getQRCodes(restaurantId, menuId);
            
            if (result.success && result.data) {
                return result.data;
            } else {
                const errorMsg = result.error || 'Failed to fetch QR codes';
                setError(errorMsg);
                toast.error(errorMsg);
                return [];
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch QR codes';
            setError(errorMsg);
            toast.error(errorMsg);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Create QR code
    const createNewQRCode = useCallback(async (
        data: {
            menuId?: string;
            restaurantId?: string;
            tableNumber: string;
        }
    ): Promise<QRCodeData | null> => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await createQRCode(data);
            
            if (result.success && result.data) {
                toast.success('QR code created successfully');
                return result.data;
            } else {
                const errorMsg = result.error || 'Failed to create QR code';
                setError(errorMsg);
                toast.error(errorMsg);
                return null;
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to create QR code';
            setError(errorMsg);
            toast.error(errorMsg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Update QR code
    const updateExistingQRCode = useCallback(async (
        id: string,
        data: {
            tableNumber?: string;
            isActive?: boolean;
            menuId?: string | null;
        }
    ): Promise<QRCodeData | null> => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await updateQRCode(id, data);
            
            if (result.success && result.data) {
                toast.success('QR code updated successfully');
                return result.data;
            } else {
                const errorMsg = result.error || 'Failed to update QR code';
                setError(errorMsg);
                toast.error(errorMsg);
                return null;
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to update QR code';
            setError(errorMsg);
            toast.error(errorMsg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Delete QR code
    const deleteExistingQRCode = useCallback(async (id: string): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await deleteQRCode(id);
            
            if (result.success) {
                toast.success('QR code deleted successfully');
                return true;
            } else {
                const errorMsg = result.error || 'Failed to delete QR code';
                setError(errorMsg);
                toast.error(errorMsg);
                return false;
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to delete QR code';
            setError(errorMsg);
            toast.error(errorMsg);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    // Toggle QR code status
    const toggleStatus = useCallback(async (id: string): Promise<QRCodeData | null> => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await toggleQRCodeStatus(id);
            
            if (result.success && result.data) {
                const status = result.data.isActive ? 'activated' : 'deactivated';
                toast.success(`QR code ${status} successfully`);
                return result.data;
            } else {
                const errorMsg = result.error || 'Failed to toggle QR code status';
                setError(errorMsg);
                toast.error(errorMsg);
                return null;
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to toggle QR code status';
            setError(errorMsg);
            toast.error(errorMsg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Bulk create QR codes
    const bulkCreate = useCallback(async (
        restaurantId: string,
        menuId: string | null,
        tableNumbers: string[]
    ): Promise<{ created: number; errors: string[] } | null> => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await bulkCreateQRCodes(restaurantId, menuId, tableNumbers);
            
            if (result.success && result.data) {
                const { created, errors } = result.data;
                if (created > 0) {
                    toast.success(`Successfully created ${created} QR codes`);
                }
                if (errors.length > 0) {
                    toast.error(`${errors.length} errors occurred during bulk creation`);
                }
                return result.data;
            } else {
                const errorMsg = result.error || 'Failed to bulk create QR codes';
                setError(errorMsg);
                toast.error(errorMsg);
                return null;
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to bulk create QR codes';
            setError(errorMsg);
            toast.error(errorMsg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Get QR code statistics
    const fetchStats = useCallback(async (restaurantId: string) => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await getQRCodeStats(restaurantId);
            
            if (result.success && result.data) {
                return result.data;
            } else {
                const errorMsg = result.error || 'Failed to fetch QR code statistics';
                setError(errorMsg);
                toast.error(errorMsg);
                return null;
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch QR code statistics';
            setError(errorMsg);
            toast.error(errorMsg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        loading,
        error,
        fetchQRCodes,
        createNewQRCode,
        updateExistingQRCode,
        deleteExistingQRCode,
        toggleStatus,
        bulkCreate,
        fetchStats,
        clearError,
    };
}

// Hook for managing QR code state
export function useQRState() {
    const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
    const [selectedQRCode, setSelectedQRCode] = useState<QRCodeData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const addQRCode = useCallback((qrCode: QRCodeData) => {
        setQrCodes(prev => [...prev, qrCode]);
    }, []);

    const updateQRCodeInState = useCallback((id: string, updates: Partial<QRCodeData>) => {
        setQrCodes(prev => prev.map(qr => 
            qr.id === id ? { ...qr, ...updates } : qr
        ));
    }, []);

    const removeQRCode = useCallback((id: string) => {
        setQrCodes(prev => prev.filter(qr => qr.id !== id));
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedQRCode(null);
        setIsEditing(false);
        setIsDeleting(false);
    }, []);

    return {
        qrCodes,
        selectedQRCode,
        isEditing,
        isDeleting,
        setQrCodes,
        setSelectedQRCode,
        setIsEditing,
        setIsDeleting,
        addQRCode,
        updateQRCodeInState,
        removeQRCode,
        clearSelection,
    };
} 