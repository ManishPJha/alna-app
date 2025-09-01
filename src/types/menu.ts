/* eslint-disable @typescript-eslint/no-explicit-any */
import { Restaurant } from './api';

// export interface MenuTheme {
//     primaryColor: string;
//     backgroundColor: string;
//     accentColor: string;
//     fontFamily: string;
// }

// export interface MenuCategory {
//     id: string;
//     name: string;
//     description: string;
//     displayOrder: number;
//     isActive: boolean;
//     items: MenuItem[];
// }

// export interface MenuItem {
//     id: string;
//     name: string;
//     description: string;
//     imageUrl?: string;
//     price: number;
//     isVegetarian: boolean;
//     isVegan: boolean;
//     isGlutenFree: boolean;
//     isSpicy: boolean;
//     isAvailable: boolean;
//     displayOrder: number;
//     categoryId?: string;
// }

export interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    preparationTime?: number;
    calories?: number;
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    isSpicy: boolean;
    spiceLevel?: number;
    isBestseller?: boolean;
    isAvailable: boolean;
    displayOrder: number;
    categoryId?: string;
    tags?: any;
    nutritionInfo?: any;
}

export interface MenuCategory {
    id: string;
    name: string;
    description?: string;
    displayOrder: number;
    isActive: boolean;
    items: MenuItem[];
    iconUrl?: string;
}

export interface MenuFAQ {
    id: string;
    question: string;
    answer: string;
    category?: string;
}

export interface MenuTheme {
    primaryColor: string;
    backgroundColor: string;
    accentColor: string;
    fontFamily: string;
}

export interface CartItem extends MenuItem {
    quantity: number;
}

export interface Cart {
    items: CartItem[];
    total: number;
    itemCount: number;
}

// New FAQ interface
export interface FAQ {
    id: string;
    question: string;
    answer: string;
}

// Menu interface for API responses
export interface Menu {
    id: string;
    name: string;
    description?: string;
    restaurantId: string;
    isActive: boolean;
    theme: MenuTheme;
    categories: MenuCategory[];
    faqs?: FAQ[]; // Optional FAQs for existing menus
    createdAt?: string;
    updatedAt?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    restaurant?: any; // Optional populated field
}

// Extended Restaurant type to include menus if needed
export interface RestaurantWithMenus extends Restaurant {
    menus: Menu[];
}
// export interface MenuFormData {
//     id?: string; // Add id field for QR code generation
//     name: string;
//     description: string;
//     restaurantId: string;
//     isActive: boolean;
//     categories: MenuCategory[];
//     theme: MenuTheme;
//     faqs: FAQ[]; // Add FAQs array
//     restaurant?: Restaurant; // Optional restaurant details
// }

export interface MenuFormData {
    id?: string;
    name: string;
    description?: string;
    restaurantId: string;
    isActive: boolean;
    categories: MenuCategory[];
    faqs: MenuFAQ[];
    theme: MenuTheme;
}
export interface MenuTheme {
    primaryColor: string;
    backgroundColor: string;
    accentColor: string;
    fontFamily: string;
}

// Default values utility
export const DEFAULT_THEME: MenuTheme = {
    primaryColor: '#1f2937',
    backgroundColor: '#f9fafb',
    accentColor: '#ef4444',
    fontFamily: 'Inter',
};

// export const getDefaultMenuFormData = (): MenuFormData => ({
//     name: '',
//     description: '',
//     restaurantId: '',
//     isActive: true,
//     categories: [],
//     theme: DEFAULT_THEME,
//     faqs: [], // Initialize empty FAQs array
// });

export function getDefaultMenuFormData(): MenuFormData {
    return {
        name: '',
        description: '',
        restaurantId: '',
        isActive: true,
        categories: [],
        faqs: [],
        theme: {
            primaryColor: '#1f2937',
            backgroundColor: '#f9fafb',
            accentColor: '#ef4444',
            fontFamily: 'Inter',
        },
    };
}

export const createNewCategory = (order: number): MenuCategory => ({
    id: `temp-cat-${Date.now()}`,
    name: 'New Category',
    description: '',
    displayOrder: order,
    isActive: true,
    items: [],
});

export const createNewMenuItem = (
    categoryId: string,
    order: number
): MenuItem => ({
    id: `temp-item-${Date.now()}`,
    name: 'New Item',
    description: '',
    price: 0,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    isAvailable: true,
    displayOrder: order,
    categoryId,
});

export const createNewFAQ = (): FAQ => ({
    id: `faq-${Date.now()}`,
    question: '',
    answer: '',
});

// Validation types
export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
