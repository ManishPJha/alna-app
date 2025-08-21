import { z } from 'zod';

export const restaurantCreateSchema = z.object({
    name: z.string().min(1, 'Restaurant name is required').max(100),
    email: z
        .string()
        .email('Invalid email address')
        .optional()
        .or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    description: z.string().optional(),
    defaultLanguage: z.string().default('en'),
    timezone: z.string().default('UTC'),
    themeColor: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
        .default('#000000'),
});

export const restaurantUpdateSchema = restaurantCreateSchema.partial();

export const userCreateSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['USER', 'MANAGER', 'ADMIN']).default('USER'),
    restaurantId: z.string().optional(),
    isActive: z.boolean().default(true),
});

export const userUpdateSchema = userCreateSchema
    .partial()
    .omit({ password: true });

export const passwordChangeSchema = z
    .object({
        oldPassword: z.string().min(1, 'Current password is required'),
        newPassword: z
            .string()
            .min(8, 'New password must be at least 8 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

export const qrCodeCreateSchema = z.object({
    name: z.string().min(1, 'QR code name is required'),
    restaurantId: z.string().min(1, 'Restaurant is required'),
    tableNumber: z.string().optional(),
    isActive: z.boolean().default(true),
});

export const menuItemCreateSchema = z.object({
    name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be positive'),
    currency: z.string().default('USD'),
    category: z.string().min(1, 'Category is required'),
    isAvailable: z.boolean().default(true),
    restaurantId: z.string().min(1, 'Restaurant is required'),
});
