'use server';

import { auth } from '@/features/auth/handlers';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Validation schemas
const profileSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    email: z
        .string()
        .email('Invalid email format')
        .max(255, 'Email is too long'),
    // restaurantId: z.string().optional().nullable(), // Allow null values
});

const restaurantSchema = z.object({
    name: z
        .string()
        .min(1, 'Restaurant name is required')
        .max(100, 'Name is too long'),
    email: z
        .string()
        .email('Invalid email format')
        .max(255, 'Email is too long')
        .optional()
        .or(z.literal('')),
    phone: z
        .string()
        .max(20, 'Phone number is too long')
        .optional()
        .or(z.literal('')),
    address: z
        .string()
        .max(500, 'Address is too long')
        .optional()
        .or(z.literal('')),
    description: z
        .string()
        .max(1000, 'Description is too long')
        .optional()
        .or(z.literal('')),
    defaultLanguage: z
        .string()
        .min(2, 'Invalid language code')
        .max(5, 'Invalid language code'),
    timezone: z.string().min(1, 'Timezone is required'),
    themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
});

export async function updateProfileAction(data: {
    name: string;
    email: string;
    // restaurantId?: string | null;
}) {
    try {
        const session = await auth();
        if (!session?.user) {
            return {
                success: false,
                error: 'Authentication required',
            };
        }

        // Validate input data
        const validationResult = profileSchema.safeParse(data);
        if (!validationResult.success) {
            const errors = validationResult.error.errors
                .map((e) => e.message)
                .join(', ');
            return { success: false, error: `Validation error: ${errors}` };
        }

        const validatedData = validationResult.data;

        // Check if email is already taken by another user
        if (validatedData.email !== session.user.email) {
            const emailExists = await db.user.findFirst({
                where: {
                    email: validatedData.email,
                    id: { not: session.user.id },
                },
            });

            if (emailExists) {
                return {
                    success: false,
                    error: 'Email is already taken by another user',
                };
            }
        }

        // Update user profile
        await db.user.update({
            where: { id: session.user.id },
            data: {
                name: validatedData.name,
                email: validatedData.email,
                updatedAt: new Date(),
                // restaurantId: validatedData.restaurantId || null,
            },
        });

        // Revalidate the settings page
        revalidatePath('/settings');

        return { success: true };
    } catch (error) {
        console.error('Profile update error:', error);
        return {
            success: false,
            error: 'An unexpected error occurred while updating your profile',
        };
    }
}

export async function changePasswordAction(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}) {
    try {
        const session = await auth();
        if (!session?.user) {
            return { success: false, error: 'Authentication required' };
        }

        const { currentPassword, newPassword, confirmPassword } = data;

        // Validate passwords
        if (!currentPassword || !newPassword || !confirmPassword) {
            return {
                success: false,
                error: 'All password fields are required',
            };
        }

        if (newPassword !== confirmPassword) {
            return { success: false, error: 'New passwords do not match' };
        }

        if (newPassword.length < 8) {
            return {
                success: false,
                error: 'New password must be at least 8 characters long',
            };
        }

        // Get current user with password hash
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, passwordHash: true },
        });

        if (!user || !user.passwordHash) {
            return {
                success: false,
                error: 'User not found or no password set',
            };
        }

        // Verify current password
        const bcrypt = await import('bcryptjs');
        const isCurrentPasswordValid = await bcrypt.compare(
            currentPassword,
            user.passwordHash
        );

        if (!isCurrentPasswordValid) {
            return { success: false, error: 'Current password is incorrect' };
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 12);

        // Update password
        await db.user.update({
            where: { id: session.user.id },
            data: {
                passwordHash: newPasswordHash,
                updatedAt: new Date(),
            },
        });

        return { success: true };
    } catch (error) {
        console.error('Password change error:', error);
        return {
            success: false,
            error: 'An unexpected error occurred while changing password',
        };
    }
}

export async function uploadAvatarAction(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user) {
            return { success: false, error: 'Authentication required' };
        }

        const file = formData.get('avatar') as File;
        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        // Validate file type and size
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return {
                success: false,
                error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
            };
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return { success: false, error: 'File size must be less than 5MB' };
        }

        // Here you would typically upload to your storage service
        // For now, we'll just return success with a placeholder URL
        const imageUrl = `/uploads/avatars/${session.user.id}-${Date.now()}.${
            file.type.split('/')[1]
        }`;

        // Update user avatar URL in database
        await db.user.update({
            where: { id: session.user.id },
            data: {
                image: imageUrl,
                updatedAt: new Date(),
            },
        });

        // Revalidate the settings page
        revalidatePath('/settings');

        return { success: true, imageUrl };
    } catch (error) {
        console.error('Avatar upload error:', error);
        return {
            success: false,
            error: 'An unexpected error occurred while uploading avatar',
        };
    }
}

export async function updateRestaurantAction(
    restaurantId: string,
    data: {
        name: string;
        email: string;
        phone: string;
        address: string;
        description: string;
        defaultLanguage: string;
        timezone: string;
        themeColor: string;
    }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return { success: false, error: 'Authentication required' };
        }

        // Check user permissions
        if (
            session.user.role === 'MANAGER' &&
            session.user.restaurantId !== restaurantId
        ) {
            return {
                success: false,
                error: 'You can only update your assigned restaurant',
            };
        }

        if (session.user.role === 'USER') {
            return { success: false, error: 'Insufficient permissions' };
        }

        // Validate input data
        const validationResult = restaurantSchema.safeParse(data);
        if (!validationResult.success) {
            const errors = validationResult.error.errors
                .map((e) => e.message)
                .join(', ');
            return { success: false, error: `Validation error: ${errors}` };
        }

        const validatedData = validationResult.data;

        // Verify restaurant exists
        const existingRestaurant = await db.restaurant.findUnique({
            where: { id: restaurantId },
        });

        if (!existingRestaurant) {
            return { success: false, error: 'Restaurant not found' };
        }

        // Check if email is already taken by another restaurant (if provided)
        if (
            validatedData.email &&
            validatedData.email !== existingRestaurant.email
        ) {
            const emailExists = await db.restaurant.findFirst({
                where: {
                    email: validatedData.email,
                    id: { not: restaurantId },
                },
            });

            if (emailExists) {
                return {
                    success: false,
                    error: 'Email is already taken by another restaurant',
                };
            }
        }

        // Update restaurant
        const updatedRestaurant = await db.restaurant.update({
            where: { id: restaurantId },
            data: {
                name: validatedData.name,
                email: validatedData.email || null,
                phone: validatedData.phone || null,
                address: validatedData.address || null,
                description: validatedData.description || null,
                defaultLanguage: validatedData.defaultLanguage,
                timezone: validatedData.timezone,
                themeColor: validatedData.themeColor,
                updatedAt: new Date(),
            },
        });

        // Revalidate the settings page
        revalidatePath('/settings');

        return { success: true, restaurant: updatedRestaurant };
    } catch (error) {
        console.error('Restaurant update error:', error);
        return {
            success: false,
            error: 'An unexpected error occurred while updating restaurant information',
        };
    }
}
