'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Building2, Menu as MenuIcon, QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    getMenusForRestaurant,
    getQRCodes,
    getRestaurantsForSelection,
    type QRCodeData,
} from '../actions/qr-code-actions';

interface RestaurantMenuSelectorProps {
    currentUser?: any;
    onQRCodesLoaded: (qrCodes: QRCodeData[]) => void;
    onLoadingChange: (loading: boolean) => void;
    onRestaurantChange: (restaurantId: string) => void;
}

export function RestaurantMenuSelector({
    currentUser,
    onQRCodesLoaded,
    onLoadingChange,
    onRestaurantChange,
}: RestaurantMenuSelectorProps) {
    const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string }>>([]);
    const [menus, setMenus] = useState<Array<{ id: string; name: string; isPublished: boolean }>>([]);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
    const [selectedMenuId, setSelectedMenuId] = useState<string>('all');
    const [loading, setLoading] = useState(false);

    const isAdmin = currentUser?.role === 'ADMIN';
    const userRestaurantId = currentUser?.restaurantId;

    // Load restaurants on component mount
    useEffect(() => {
        loadRestaurants();
    }, []);

    // Auto-select user's restaurant for managers
    useEffect(() => {
        console.log('Auto-select effect:', { isAdmin, userRestaurantId });
        if (!isAdmin && userRestaurantId) {
            console.log('Setting manager restaurant:', userRestaurantId);
            setSelectedRestaurantId(userRestaurantId);
        }
    }, [isAdmin, userRestaurantId]);

    // Load menus when restaurant changes
    useEffect(() => {
        if (selectedRestaurantId) {
            loadMenus(selectedRestaurantId);
            // Don't reset menu selection here to avoid triggering duplicate QR code loads
        } else {
            setMenus([]);
            setSelectedMenuId('all');
        }
    }, [selectedRestaurantId]);

    // Load QR codes when restaurant changes
    useEffect(() => {
        console.log('QR Code Load Effect (Restaurant):', { selectedRestaurantId, selectedMenuId });
        if (selectedRestaurantId) {
            const menuId = selectedMenuId === 'all' ? undefined : selectedMenuId;
            console.log('Loading QR codes for:', { restaurantId: selectedRestaurantId, menuId });
            loadQRCodes(selectedRestaurantId, menuId);
        } else {
            console.log('No restaurant selected, clearing QR codes');
            onQRCodesLoaded([]);
        }
    }, [selectedRestaurantId]); // Only depend on restaurantId, not menuId

    // Handle manual menu selection changes
    useEffect(() => {
        if (selectedRestaurantId && selectedMenuId !== 'all') {
            console.log('Menu selection changed, reloading QR codes for menu:', selectedMenuId);
            loadQRCodes(selectedRestaurantId, selectedMenuId);
        }
    }, [selectedMenuId]); // Only depend on menuId

    const loadRestaurants = async () => {
        try {
            setLoading(true);
            const result = await getRestaurantsForSelection();
            
            if (result.success && result.data) {
                setRestaurants(result.data);
                
                // Auto-select first restaurant for admins
                if (isAdmin && result.data.length > 0) {
                    console.log('Setting admin restaurant:', result.data[0].id);
                    setSelectedRestaurantId(result.data[0].id);
                }
            } else {
                toast.error(result.error || 'Failed to load restaurants');
            }
        } catch (error) {
            console.error('Error loading restaurants:', error);
            toast.error('Failed to load restaurants');
        } finally {
            setLoading(false);
        }
    };

    const loadMenus = async (restaurantId: string) => {
        try {
            setLoading(true);
            const result = await getMenusForRestaurant(restaurantId);
            
            if (result.success && result.data) {
                setMenus(result.data);
                
                // Auto-select first published menu if available, otherwise first menu
                const publishedMenu = result.data.find(menu => menu.isPublished);
                if (publishedMenu) {
                    setSelectedMenuId(publishedMenu.id);
                } else if (result.data.length > 0) {
                    setSelectedMenuId(result.data[0].id);
                } else {
                    setSelectedMenuId('all');
                }
            } else {
                setMenus([]);
                if (result.error) {
                    toast.error(result.error);
                }
            }
        } catch (error) {
            console.error('Error loading menus:', error);
            setMenus([]);
            toast.error('Failed to load menus');
        } finally {
            setLoading(false);
        }
    };

    const loadQRCodes = async (restaurantId: string, menuId?: string) => {
        console.log('loadQRCodes called with:', { restaurantId, menuId });
        try {
            setLoading(true);
            onLoadingChange(true);
            
            const result = await getQRCodes(restaurantId, menuId);
            console.log('getQRCodes result:', result);
            
            if (result.success && result.data) {
                console.log('QR codes loaded successfully:', result.data.length);
                console.log('Calling onQRCodesLoaded with:', result.data.length, 'QR codes');
                onQRCodesLoaded(result.data);
            } else {
                onQRCodesLoaded([]);
                if (result.error) {
                    toast.error(result.error);
                }
            }
        } catch (error) {
            console.error('Error loading QR codes:', error);
            onQRCodesLoaded([]);
            toast.error('Failed to load QR codes');
        } finally {
            setLoading(false);
            onLoadingChange(false);
        }
    };

    const handleRestaurantChange = (restaurantId: string) => {
        setSelectedRestaurantId(restaurantId);
        onRestaurantChange(restaurantId);
    };

    const handleMenuChange = (menuId: string) => {
        setSelectedMenuId(menuId);
    };

    const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);
    const selectedMenu = menus.find(m => m.id === selectedMenuId);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Restaurant & Menu Selection
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Restaurant Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        Restaurant
                    </label>
                    <Select
                        value={selectedRestaurantId}
                        onValueChange={handleRestaurantChange}
                        disabled={loading || (!isAdmin && !!userRestaurantId)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a restaurant" />
                        </SelectTrigger>
                        <SelectContent>
                            {restaurants.map((restaurant) => (
                                <SelectItem key={restaurant.id} value={restaurant.id}>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        {restaurant.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Menu Selection */}
                {selectedRestaurantId && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Menu
                        </label>
                        <Select
                            value={selectedMenuId}
                            onValueChange={handleMenuChange}
                            disabled={loading || menus.length === 0}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a menu" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    <div className="flex items-center gap-2">
                                        <QrCode className="h-4 w-4" />
                                        All QR Codes (No Menu)
                                    </div>
                                </SelectItem>
                                {menus.map((menu) => (
                                    <SelectItem key={menu.id} value={menu.id}>
                                        <div className="flex items-center gap-2">
                                            <MenuIcon className="h-4 w-4" />
                                            {menu.name}
                                            {!menu.isPublished && (
                                                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                                    Draft
                                                </span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Selection Summary */}
                {selectedRestaurant && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-2 mb-1">
                                <Building2 className="h-4 w-4" />
                                <span className="font-medium">Selected Restaurant:</span>
                                <span className="text-gray-800">{selectedRestaurant.name}</span>
                            </div>
                            {selectedMenu && (
                                <div className="flex items-center gap-2">
                                    <MenuIcon className="h-4 w-4" />
                                    <span className="font-medium">Selected Menu:</span>
                                    <span className="text-gray-800">{selectedMenu.name}</span>
                                    {!selectedMenu.isPublished && (
                                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                            Draft
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Loading...</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 