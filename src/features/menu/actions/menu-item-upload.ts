'use server';

import { db } from '@/lib/db';
import { getUploadService } from '@/lib/upload/service';
import { requireAuth } from '@/utils/auth-utils';
import { revalidatePath } from 'next/cache';

interface UploadMenuItemImageResult {
    success: boolean;
    imageUrl?: string;
    error?: string;
}

export async function uploadMenuItemImage(
    formData: FormData,
    menuItemId?: string // Optional for existing menu items
): Promise<UploadMenuItemImageResult> {
    try {
        // Check authentication
        const { error: authError, user } = await requireAuth();
        if (authError || !user) {
            return { success: false, error: 'Authentication required' };
        }

        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return { success: false, error: 'File must be an image' };
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            return {
                success: false,
                error: 'Image size must be less than 5MB',
            };
        }

        // Convert File to UploadFile format
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadFile = {
            buffer,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            key: `menu-items/${Date.now()}_${file.name.replace(
                /[^a-zA-Z0-9.-]/g,
                '_'
            )}`,
        };

        // Upload the file using the upload service
        const uploadService = getUploadService();
        const uploadResult = await uploadService.upload(uploadFile);

        if (!uploadResult.success) {
            return { success: false, error: 'Failed to upload image' };
        }

        // If menuItemId is provided, update the existing menu item
        if (menuItemId) {
            // First verify the menu item exists and user has permission
            const menuItem = await db.menuItem.findUnique({
                where: { id: menuItemId },
                include: {
                    restaurant: true,
                },
            });

            if (!menuItem) {
                return { success: false, error: 'Menu item not found' };
            }

            // Check permissions (manager can only edit items from their restaurant)
            if (
                user.role === 'MANAGER' &&
                user.restaurantId !== menuItem.restaurantId
            ) {
                return { success: false, error: 'Permission denied' };
            }

            // Update the menu item with the new image URL
            await db.menuItem.update({
                where: { id: menuItemId },
                data: {
                    imageUrl: uploadResult.url,
                },
            });

            // Revalidate the menu pages
            revalidatePath(`/manager/menus`);
            revalidatePath(`/menu/${menuItem.restaurant.id}`);
        }

        return {
            success: true,
            imageUrl: uploadResult.url,
        };
    } catch (error) {
        console.error('Menu item image upload failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}

export async function removeMenuItemImage(
    menuItemId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Check authentication
        const { error: authError, user } = await requireAuth();
        if (authError || !user) {
            return { success: false, error: 'Authentication required' };
        }

        // Get the menu item to check permissions and get the current image URL
        const menuItem = await db.menuItem.findUnique({
            where: { id: menuItemId },
            include: {
                restaurant: true,
            },
        });

        if (!menuItem) {
            return { success: false, error: 'Menu item not found' };
        }

        // Check permissions
        if (
            user.role === 'MANAGER' &&
            user.restaurantId !== menuItem.restaurantId
        ) {
            return { success: false, error: 'Permission denied' };
        }

        // If there's an existing image, try to delete it from storage
        if (menuItem.imageUrl) {
            try {
                const uploadService = getUploadService();

                // Extract key from URL if possible (this depends on your URL structure)
                // Attempt to extract the file key from the URL
                // Example URL:
                // https://fra.cloud.appwrite.io/v1/storage/buckets/68b52cc3002c335639f8/files/fc9f9648dc6241b6ad9d280f68acd8c0/view?project=68b52abf0034894f25db
                // Desired key: fc9f9648dc6241b6ad9d280f68acd8c0
                const urlParts = menuItem.imageUrl.split('/');
                let key = urlParts[urlParts.length - 2]; // safer extraction before "view?..."

                // Fallback: try last segment (in case of different provider structure)
                if (!key || key.includes('view')) {
                    key = urlParts.pop() ?? '';
                }

                if (!key) {
                    return {
                        success: false,
                        error: 'Failed to extract file key from URL',
                    };
                }

                await uploadService.delete(key);
            } catch (deleteError) {
                console.warn(
                    'Failed to delete old image from storage:',
                    deleteError
                );
                // Continue anyway - we'll still remove the URL from database
            }
        }

        // // Remove the image URL from the database
        // await db.menuItem.update({
        //     where: { id: menuItemId },
        //     data: {
        //         imageUrl: null,
        //     },
        // });

        // Revalidate the menu pages
        revalidatePath(`/manager/menus`);
        revalidatePath(`/menu/${menuItem.restaurant.id}`);

        return { success: true };
    } catch (error) {
        console.error('Menu item image removal failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Removal failed',
        };
    }
}

// Action to update menu item image during menu editing (before saving to DB)
export async function uploadTemporaryMenuItemImage(
    formData: FormData
): Promise<UploadMenuItemImageResult> {
    try {
        // Check authentication
        const { error: authError } = await requireAuth();
        if (authError) {
            return { success: false, error: 'Authentication required' };
        }

        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        // Validate file
        if (!file.type.startsWith('image/')) {
            return { success: false, error: 'File must be an image' };
        }

        if (file.size > 5 * 1024 * 1024) {
            return {
                success: false,
                error: 'Image size must be less than 5MB',
            };
        }

        // Upload the file
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadFile = {
            buffer,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            key: `temp-menu-items/${Date.now()}_${file.name.replace(
                /[^a-zA-Z0-9.-]/g,
                '_'
            )}`,
        };

        const uploadService = getUploadService();
        const uploadResult = await uploadService.upload(uploadFile);

        if (!uploadResult.success) {
            return { success: false, error: 'Failed to upload image' };
        }

        return {
            success: true,
            imageUrl: uploadResult.url,
        };
    } catch (error) {
        console.error('Temporary image upload failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}
