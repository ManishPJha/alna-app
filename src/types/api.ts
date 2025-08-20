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
}

export interface User {
    id: string;
    name?: string;
    email?: string;
    role: 'USER' | 'MANAGER' | 'ADMIN';
    isActive: boolean;
    restaurantId?: string;
    lastLogin?: string;
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
    data?: T;
    error?: string;
    message?: string;
}
