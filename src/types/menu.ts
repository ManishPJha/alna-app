// types/menu.ts - Add these to your existing types/api.ts file

import { Restaurant } from './api';

export interface MenuTheme {
    primaryColor: string;
    backgroundColor: string;
    accentColor: string;
    fontFamily: string;
}

export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    isSpicy: boolean;
    isAvailable: boolean;
    displayOrder: number;
    categoryId: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface MenuCategory {
    id: string;
    name: string;
    description?: string;
    displayOrder: number;
    isActive: boolean;
    menuId: string;
    items: MenuItem[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Menu {
    id: string;
    name: string;
    description?: string;
    restaurantId: string;
    isActive: boolean;
    theme: MenuTheme;
    categories: MenuCategory[];
    createdAt?: string;
    updatedAt?: string;
    restaurant?: Restaurant; // Optional populated field
}

// Extended Restaurant type to include menus if needed
export interface RestaurantWithMenus extends Restaurant {
    menus: Menu[];
}

// import { z } from 'zod';

// // Core Menu Types
// export const MenuItemSchema = z.object({
//     id: z.string(),
//     categoryId: z.string(),
//     name: z.string().min(1, 'Name is required'),
//     description: z.string().optional().default(''),
//     price: z.number().min(0, 'Price must be positive'),
//     imageUrl: z.string().url().optional(),
//     preparationTime: z.number().optional(),
//     calories: z.number().optional(),
//     isVegetarian: z.boolean().default(false),
//     isVegan: z.boolean().default(false),
//     isGlutenFree: z.boolean().default(false),
//     isSpicy: z.boolean().default(false),
//     spiceLevel: z.number().min(0).max(5).default(0),
//     isBestseller: z.boolean().default(false),
//     isAvailable: z.boolean().default(true),
//     isVisible: z.boolean().default(true),
//     displayOrder: z.number().default(0),
//     tags: z.array(z.string()).optional().default([]),
//     nutritionInfo: z.record(z.any()).optional(),
//     createdAt: z.date().optional(),
//     updatedAt: z.date().optional(),
// });

// export const MenuCategorySchema = z.object({
//     id: z.string(),
//     restaurantId: z.string(),
//     name: z.string().min(1, 'Category name is required'),
//     description: z.string().optional().default(''),
//     displayOrder: z.number().default(0),
//     isActive: z.boolean().default(true),
//     isVisible: z.boolean().default(true),
//     iconUrl: z.string().url().optional(),
//     items: z.array(MenuItemSchema).default([]),
//     createdAt: z.date().optional(),
//     updatedAt: z.date().optional(),
// });

// export const MenuThemeSchema = z.object({
//     primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
//     backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
//     accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
//     fontFamily: z.string().default('Inter'),
// });

// export const RestaurantMenuSchema = z.object({
//     id: z.string(),
//     name: z.string().min(1, 'Restaurant name is required'),
//     description: z.string().optional(),
//     menuTheme: MenuThemeSchema,
//     isMenuPublished: z.boolean().default(false),
//     menuVersion: z.number().default(1),
//     lastMenuUpdate: z.date().optional(),
//     categories: z.array(MenuCategorySchema).default([]),
// });

// // Form Input Types
// export const CreateMenuItemSchema = MenuItemSchema.omit({
//     id: true,
//     createdAt: true,
//     updatedAt: true,
// });

// export const UpdateMenuItemSchema = CreateMenuItemSchema.partial();

// export const CreateMenuCategorySchema = MenuCategorySchema.omit({
//     id: true,
//     restaurantId: true,
//     items: true,
//     createdAt: true,
//     updatedAt: true,
// });

// export const UpdateMenuCategorySchema = CreateMenuCategorySchema.partial();

// export const UpdateRestaurantThemeSchema = z.object({
//     restaurantId: z.string(),
//     menuTheme: MenuThemeSchema,
//     name: z.string().optional(),
//     description: z.string().optional(),
// });

// // Bulk Operations
// export const ReorderItemsSchema = z.object({
//     categoryId: z.string(),
//     itemOrders: z.array(
//         z.object({
//             itemId: z.string(),
//             displayOrder: z.number(),
//         })
//     ),
// });

// export const ReorderCategoriesSchema = z.object({
//     restaurantId: z.string(),
//     categoryOrders: z.array(
//         z.object({
//             categoryId: z.string(),
//             displayOrder: z.number(),
//         })
//     ),
// });

// // Inferred Types
// export type MenuItem = z.infer<typeof MenuItemSchema>;
// export type MenuCategory = z.infer<typeof MenuCategorySchema>;
// export type MenuTheme = z.infer<typeof MenuThemeSchema>;
// export type RestaurantMenu = z.infer<typeof RestaurantMenuSchema>;

// export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>;
// export type UpdateMenuItemInput = z.infer<typeof UpdateMenuItemSchema>;
// export type CreateMenuCategoryInput = z.infer<typeof CreateMenuCategorySchema>;
// export type UpdateMenuCategoryInput = z.infer<typeof UpdateMenuCategorySchema>;
// export type UpdateRestaurantThemeInput = z.infer<
//     typeof UpdateRestaurantThemeSchema
// >;

// export type ReorderItemsInput = z.infer<typeof ReorderItemsSchema>;
// export type ReorderCategoriesInput = z.infer<typeof ReorderCategoriesSchema>;

// // Response Types
// export type MenuEditorResponse<T = unknown> = {
//     success: boolean;
//     data?: T;
//     error?: string;
//     validationErrors?: Record<string, string[] | undefined>;
// };

// // UI State Types
// export type EditorTab = 'content' | 'theme' | 'preview';

// export type MenuEditorState = {
//     restaurant: RestaurantMenu;
//     categories: MenuCategory[];
//     activeTab: EditorTab;
//     searchTerm: string;
//     isDirty: boolean;
//     isSaving: boolean;
//     lastSaved?: Date;
// };

// export type MenuEditorAction =
//     | { type: 'SET_RESTAURANT'; payload: RestaurantMenu }
//     | { type: 'SET_CATEGORIES'; payload: MenuCategory[] }
//     | { type: 'SET_ACTIVE_TAB'; payload: EditorTab }
//     | { type: 'SET_SEARCH_TERM'; payload: string }
//     | { type: 'SET_DIRTY'; payload: boolean }
//     | { type: 'SET_SAVING'; payload: boolean }
//     | { type: 'SET_LAST_SAVED'; payload: Date }
//     | { type: 'ADD_CATEGORY'; payload: MenuCategory }
//     | {
//           type: 'UPDATE_CATEGORY';
//           payload: { id: string; updates: Partial<MenuCategory> };
//       }
//     | { type: 'DELETE_CATEGORY'; payload: string }
//     | { type: 'ADD_ITEM'; payload: { categoryId: string; item: MenuItem } }
//     | {
//           type: 'UPDATE_ITEM';
//           payload: {
//               categoryId: string;
//               itemId: string;
//               updates: Partial<MenuItem>;
//           };
//       }
//     | { type: 'DELETE_ITEM'; payload: { categoryId: string; itemId: string } }
//     | { type: 'UPDATE_THEME'; payload: Partial<MenuTheme> };
