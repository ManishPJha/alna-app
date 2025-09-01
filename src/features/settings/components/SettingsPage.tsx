'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    SettingsPageClientProps,
    updateProfileAction,
    updateRestaurantAction,
} from '@/features/settings';
import {
    AlertCircle,
    Building,
    CheckCircle,
    Clock,
    MapPin,
    RefreshCw,
    Save,
    Settings,
    Upload,
    User,
} from 'lucide-react';
import { useState } from 'react';
import { PasswordChangeForm } from './PasswordChangeForm';
import UploadAdminInterface from './UploadInterface';

const timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
];

const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'zh', label: 'Chinese' },
];

const themeColors = [
    '#2563eb',
    '#7c3aed',
    '#dc2626',
    '#ea580c',
    '#ca8a04',
    '#16a34a',
    '#0891b2',
    '#be185d',
    '#4f46e5',
    '#059669',
    '#0d9488',
    '#7c2d12',
];

export function SettingsPageClient({ user }: SettingsPageClientProps) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    // Profile form state
    const [profileData, setProfileData] = useState({
        name: user.name || '',
        email: user.email || '',
        restaurantId: user.restaurantId || '',
    });

    // Restaurant form state (only for managers with assigned restaurant)
    const [restaurantData, setRestaurantData] = useState({
        name: user.restaurant?.name || '',
        email: user.restaurant?.email || '',
        phone: user.restaurant?.phone || '',
        address: user.restaurant?.address || '',
        description: user.restaurant?.description || '',
        defaultLanguage: user.restaurant?.defaultLanguage || 'en',
        timezone: user.restaurant?.timezone || 'UTC',
        themeColor: user.restaurant?.themeColor || '#2563eb',
    });

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const result = await updateProfileAction({
                name: profileData.name,
                email: profileData.email,
                // restaurantId: user.role === 'ADMIN' ? profileData.restaurantId : user.restaurantId,
            });

            if (result?.success) {
                setMessage({
                    type: 'success',
                    text: 'Profile updated successfully!',
                });
            } else {
                setMessage({
                    type: 'error',
                    text: result?.error || 'Failed to update profile',
                });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const handleRestaurantSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user.restaurant?.id) return;

        setLoading(true);
        setMessage(null);

        try {
            const result = await updateRestaurantAction(
                user.restaurant.id,
                restaurantData
            );

            if (result.success) {
                setMessage({
                    type: 'success',
                    text: 'Restaurant information updated successfully!',
                });
            } else {
                setMessage({
                    type: 'error',
                    text:
                        result.error ||
                        'Failed to update restaurant information',
                });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (date: Date | null) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleString();
    };

    return (
        <div className="space-y-6">
            {/* Status Message */}
            {message && (
                <Alert
                    variant={
                        message.type === 'error' ? 'destructive' : 'default'
                    }
                    className={
                        message.type === 'success'
                            ? 'border-green-200 bg-green-50'
                            : ''
                    }
                >
                    {message.type === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                        <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription
                        className={
                            message.type === 'success' ? 'text-green-800' : ''
                        }
                    >
                        {message.text}
                    </AlertDescription>
                </Alert>
            )}

            {/* Main Tabs */}
            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
                    <TabsTrigger
                        value="profile"
                        className="flex items-center gap-2"
                    >
                        <User className="w-4 h-4" />
                        Profile
                    </TabsTrigger>
                    {user.restaurant && (
                        <TabsTrigger
                            value="restaurant"
                            className="flex items-center gap-2"
                        >
                            <Building className="w-4 h-4" />
                            Restaurant
                        </TabsTrigger>
                    )}
                    {user.role === 'ADMIN' && (
                        <TabsTrigger
                            value="upload"
                            className="flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            Upload Settings
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Profile Information Card */}
                        <Card>
                            <CardHeader className="bg-alna-gradient text-white rounded-t-lg">
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Profile Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form
                                    onSubmit={handleProfileSubmit}
                                    className="space-y-4"
                                >
                                    <div>
                                        <Label
                                            htmlFor="name"
                                            className="text-sm font-medium text-gray-700"
                                        >
                                            Full Name
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) =>
                                                setProfileData({
                                                    ...profileData,
                                                    name: e.target.value,
                                                })
                                            }
                                            className="mt-1"
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    <div>
                                        <Label
                                            htmlFor="email"
                                            className="text-sm font-medium text-gray-700"
                                        >
                                            Email Address
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) =>
                                                setProfileData({
                                                    ...profileData,
                                                    email: e.target.value,
                                                })
                                            }
                                            className="mt-1"
                                            placeholder="Enter your email address"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full btn-primary flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        {loading
                                            ? 'Updating...'
                                            : 'Update Profile'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Account Status Card */}
                        <Card>
                            <CardHeader className="bg-alna-gradient text-white rounded-t-lg">
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    Account Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">
                                            Role:
                                        </span>
                                        <Badge
                                            className={`${
                                                user.role === 'ADMIN'
                                                    ? 'bg-purple-500 text-white'
                                                    : user.role === 'MANAGER'
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-500 text-white'
                                            }`}
                                        >
                                            {user.role}
                                        </Badge>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">
                                            Status:
                                        </span>
                                        <Badge
                                            className={
                                                user.isActive
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-red-500 text-white'
                                            }
                                        >
                                            {user.isActive
                                                ? 'Active'
                                                : 'Inactive'}
                                        </Badge>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">
                                            Member since:
                                        </span>
                                        <span className="text-sm text-gray-600 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDateTime(
                                                new Date(user.createdAt)
                                            )}
                                        </span>
                                    </div>

                                    {/* TODO: Need to add last login functionality */}
                                    {/* <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">
                                            Last login:
                                        </span>
                                        {user.lastLogin ? (
                                            <span className="text-sm text-gray-600 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDateTime(
                                                    new Date(user.lastLogin)
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-600 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Never
                                            </span>
                                        )}
                                    </div>
 */}
                                    {user.restaurant && (
                                        <div className="pt-4 border-t border-gray-200">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                Restaurant Assignment
                                            </h4>
                                            <div className="text-sm text-gray-600">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Building className="w-3 h-3" />
                                                    {user.restaurant.name}
                                                </div>
                                                {user.restaurant.address && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {
                                                            user.restaurant
                                                                .address
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                    <PasswordChangeForm />
                </TabsContent>

                {/* Restaurant Tab */}
                {user.restaurant && (
                    <TabsContent value="restaurant" className="space-y-6">
                        <Card>
                            <CardHeader className="bg-alna-gradient text-white rounded-t-lg">
                                <CardTitle className="flex items-center gap-2">
                                    <Building className="w-5 h-5" />
                                    Restaurant Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form
                                    onSubmit={handleRestaurantSubmit}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label
                                                htmlFor="restaurantName"
                                                className="text-sm font-medium text-gray-700"
                                            >
                                                Restaurant Name
                                            </Label>
                                            <Input
                                                id="restaurantName"
                                                type="text"
                                                value={restaurantData.name}
                                                onChange={(e) =>
                                                    setRestaurantData({
                                                        ...restaurantData,
                                                        name: e.target.value,
                                                    })
                                                }
                                                className="mt-1"
                                                placeholder="Restaurant name"
                                            />
                                        </div>

                                        <div>
                                            <Label
                                                htmlFor="restaurantEmail"
                                                className="text-sm font-medium text-gray-700"
                                            >
                                                Restaurant Email
                                            </Label>
                                            <Input
                                                id="restaurantEmail"
                                                type="email"
                                                value={restaurantData.email}
                                                onChange={(e) =>
                                                    setRestaurantData({
                                                        ...restaurantData,
                                                        email: e.target.value,
                                                    })
                                                }
                                                className="mt-1"
                                                placeholder="restaurant@example.com"
                                            />
                                        </div>

                                        <div>
                                            <Label
                                                htmlFor="restaurantPhone"
                                                className="text-sm font-medium text-gray-700"
                                            >
                                                Phone Number
                                            </Label>
                                            <Input
                                                id="restaurantPhone"
                                                type="tel"
                                                value={restaurantData.phone}
                                                onChange={(e) =>
                                                    setRestaurantData({
                                                        ...restaurantData,
                                                        phone: e.target.value,
                                                    })
                                                }
                                                className="mt-1"
                                                placeholder="+1 (555) 123-4567"
                                            />
                                        </div>

                                        {/* <div>
                                            <Label
                                                htmlFor="defaultLanguage"
                                                className="text-sm font-medium text-gray-700"
                                            >
                                                Default Language
                                            </Label>
                                            <Select
                                                value={
                                                    restaurantData.defaultLanguage
                                                }
                                                onValueChange={(value) =>
                                                    setRestaurantData({
                                                        ...restaurantData,
                                                        defaultLanguage: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {languages.map((lang) => (
                                                        <SelectItem
                                                            key={lang.value}
                                                            value={
                                                                lang.value || ''
                                                            }
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Globe className="w-4 h-4" />
                                                                {lang.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label
                                                htmlFor="timezone"
                                                className="text-sm font-medium text-gray-700"
                                            >
                                                Timezone
                                            </Label>
                                            <Select
                                                value={restaurantData.timezone}
                                                onValueChange={(value) =>
                                                    setRestaurantData({
                                                        ...restaurantData,
                                                        timezone: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {timezones.map((tz) => (
                                                        <SelectItem
                                                            key={tz.value}
                                                            value={
                                                                tz.value || ''
                                                            }
                                                        >
                                                            {tz.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label
                                                htmlFor="themeColor"
                                                className="text-sm font-medium text-gray-700"
                                            >
                                                Theme Color
                                            </Label>
                                            <div className="mt-2 flex gap-2 flex-wrap">
                                                {themeColors.map((color) => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() =>
                                                            setRestaurantData({
                                                                ...restaurantData,
                                                                themeColor:
                                                                    color,
                                                            })
                                                        }
                                                        className={`w-8 h-8 rounded-full border-2 ${
                                                            restaurantData.themeColor ===
                                                            color
                                                                ? 'border-gray-900 ring-2 ring-gray-300'
                                                                : 'border-gray-200'
                                                        }`}
                                                        style={{
                                                            backgroundColor:
                                                                color,
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div> */}
                                        <div>
                                            <Label
                                                htmlFor="address"
                                                className="text-sm font-medium text-gray-700"
                                            >
                                                Address
                                            </Label>
                                            <Input
                                                id="address"
                                                type="text"
                                                value={restaurantData.address}
                                                onChange={(e) =>
                                                    setRestaurantData({
                                                        ...restaurantData,
                                                        address: e.target.value,
                                                    })
                                                }
                                                className="mt-1"
                                                placeholder="Full restaurant address"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="description"
                                            className="text-sm font-medium text-gray-700"
                                        >
                                            Description
                                        </Label>
                                        <textarea
                                            id="description"
                                            value={restaurantData.description}
                                            onChange={(e) =>
                                                setRestaurantData({
                                                    ...restaurantData,
                                                    description: e.target.value,
                                                })
                                            }
                                            rows={3}
                                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Brief description of your restaurant"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        {loading
                                            ? 'Updating...'
                                            : 'Update Restaurant'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* Upload Settings Tab (Admin Only) */}
                {user.role === 'ADMIN' && (
                    <TabsContent value="upload" className="space-y-6">
                        <UploadAdminInterface />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
