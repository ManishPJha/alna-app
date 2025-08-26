import { MenuCategory } from './menu';

export interface Restaurant {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    description?: string;
    defaultLanguage: string;
    timezone: string;
    logoUrl?: string;
    themeColor: string;
    createdAt: string;
    updatedAt: string;

    // Computed fields
    managersCount?: number;
    qrCodesCount?: number;
    menuItemsCount?: number;

    // Relations (when included)
    managers?: User[];
    qrCodes?: QRCode[];
    menuItems?: MenuItem[];
    categories?: MenuCategory[];
}

export interface User {
    id: string;
    name?: string;
    email?: string;
    role: 'MANAGER' | 'ADMIN';
    isActive: boolean;
    restaurantId?: string;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
    image?: string;

    // Relations
    restaurant?: Restaurant;
}

export interface QRCode {
    id: string;
    name: string;
    restaurantId: string;
    tableNumber?: string;
    url: string;
    isActive: boolean;
    scansCount: number;
    lastScanAt?: string;
    createdAt: string;
    updatedAt: string;

    // Relations
    restaurant?: Restaurant;
}

export interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    category: string;
    isAvailable: boolean;
    imageUrl?: string;
    restaurantId: string;
    calories?: number;
    isVegetarian?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    isSpicy?: boolean;
    spicyLevel?: number;
    isBestseller?: boolean;
    displayOrder?: number;
    createdAt: string;
    updatedAt: string;

    // Relations
    restaurant?: Restaurant;
}

export interface RestaurantManager extends User {
    role: 'MANAGER';
    restaurantId: string;
    restaurant: Restaurant;
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    status?: number;
    data?: T;
    error?: string;
    message?: string;
}

export interface ApiError {
    message: string;
    status?: number;
    code?: string;
}

export type { Menu } from './menu';
