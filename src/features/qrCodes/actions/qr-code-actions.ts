'use server';

import { db } from '@/lib/db';
import { requireAuth } from '@/utils/auth-utils';
import { revalidatePath } from 'next/cache';

// Types
export interface QRCodeData {
    id: string;
    restaurantId: string;
    menuId?: string | null;
    tableNumber?: string | null;
    qrToken: string;
    qrImageUrl?: string | null;
    isActive: boolean;
    scanCount: number;
    lastScanned?: string | null;
    createdAt: string;
    updatedAt: string;
    restaurant: {
        id: string;
        name: string;
    };
    menu?: {
        id: string;
        name: string;
        restaurant: {
            id: string;
            name: string;
        };
    } | null;
}

// Helper to normalize Prisma QRCode payloads into QRCodeData
function toQRCodeData(qr: any): QRCodeData {
    return {
        id: qr.id,
        restaurantId: qr.restaurantId,
        menuId: qr.menuId ?? null,
        tableNumber: qr.tableNumber ?? null,
        qrToken: qr.qrToken,
        qrImageUrl: qr.qrImageUrl ?? null,
        isActive: qr.isActive,
        scanCount: qr.scanCount,
        lastScanned: qr.lastScanned ? new Date(qr.lastScanned).toISOString() : null,
        createdAt: new Date(qr.createdAt).toISOString(),
        updatedAt: new Date(qr.updatedAt).toISOString(),
        restaurant: {
            id: qr.restaurant?.id,
            name: qr.restaurant?.name,
        },
        menu: qr.menu
            ? {
                  id: qr.menu.id,
                  name: qr.menu.name,
                  restaurant: qr.menu.restaurant
                      ? { id: qr.menu.restaurant.id, name: qr.menu.restaurant.name }
                      : undefined as any, // when not selected, keep undefined to satisfy optional chain
              }
            : null,
    } as QRCodeData;
}

export interface RestaurantData {
    id: string;
    name: string;
}

export interface MenuData {
    id: string;
    name: string;
    isPublished: boolean;
}

// Action Results
export interface ActionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export type QRCodeActionResult = ActionResult<QRCodeData>;
export type QRCodeListActionResult = ActionResult<QRCodeData[]>;
export type RestaurantListActionResult = ActionResult<RestaurantData[]>;
export type MenuListActionResult = ActionResult<MenuData[]>;

// Get QR Codes
export async function getQRCodes(
    restaurantId: string,
    menuId?: string
): Promise<QRCodeListActionResult> {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) {
            return { success: false, error: 'Authentication required' };
        }

        // Check access permissions
        if (user.role === 'MANAGER' && user.restaurantId !== restaurantId) {
            return { success: false, error: 'Access denied to this restaurant' };
        }

        let whereClause: any = { restaurantId };
        const includeClause: any = {
            restaurant: {
                select: {
                    id: true,
                    name: true,
                },
            },
        };

        // Handle menu-based query
        if (menuId) {
            const menu = await db.menu.findUnique({
                where: { id: menuId },
                include: { restaurant: true },
            });

            if (!menu) {
                return { success: false, error: 'Menu not found' };
            }

            if (user.role === 'MANAGER' && user.restaurantId !== menu.restaurantId) {
                return { success: false, error: 'Access denied to this menu' };
            }

            whereClause = {
                OR: [
                    { menuId: menuId },
                    { restaurantId: menu.restaurantId, menuId: null },
                ],
            };

            includeClause.menu = {
                select: {
                    id: true,
                    name: true,
                    restaurant: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            };
        }

        const qrCodes = await db.qRCode.findMany({
            where: whereClause,
            include: includeClause,
            orderBy: [{ tableNumber: 'asc' }, { createdAt: 'desc' }],
        });

        return {
            success: true,
            data: qrCodes.map((qr: any) => toQRCodeData(qr)),
        };
    } catch (error) {
        console.error('Error getting QR codes:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get QR codes',
        };
    }
}

// Create QR Code
export async function createQRCode(
    data: {
        menuId?: string;
        restaurantId?: string;
        tableNumber: string;
    }
): Promise<QRCodeActionResult> {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) {
            return { success: false, error: 'Authentication required' };
        }

        const { menuId, restaurantId, tableNumber } = data;

        if (!menuId && !restaurantId) {
            return { success: false, error: 'menuId or restaurantId is required' };
        }

        if (!tableNumber?.trim()) {
            return { success: false, error: 'tableNumber is required' };
        }

        let finalMenuId = menuId;
        let finalRestaurantId = restaurantId;

        // Handle menu-based creation
        if (menuId) {
            const menu = await db.menu.findUnique({
                where: { id: menuId },
                select: { id: true, restaurantId: true },
            });

            if (!menu) {
                return { success: false, error: 'Menu not found' };
            }

            if (user.role === 'MANAGER' && user.restaurantId !== menu.restaurantId) {
                return { success: false, error: 'Access denied to this menu' };
            }

            finalRestaurantId = menu.restaurantId;
        }
        // Handle restaurant-based creation
        else if (restaurantId) {
            if (user.role === 'MANAGER' && user.restaurantId !== restaurantId) {
                return { success: false, error: 'Access denied to this restaurant' };
            }

            // Try to get default menu
            const defaultMenu = await db.menu.findFirst({
                where: {
                    restaurantId,
                    isActive: true,
                },
                select: { id: true },
                orderBy: { createdAt: 'asc' },
            });

            if (defaultMenu) {
                finalMenuId = defaultMenu.id;
            }
            finalRestaurantId = restaurantId;
        }

        if (!finalRestaurantId) {
            return { success: false, error: 'Could not determine restaurant' };
        }

        // Check for existing QR code with same table number
        const existingWhere: any = {
            restaurantId: finalRestaurantId,
            tableNumber: tableNumber.trim(),
        };

        if (finalMenuId) {
            existingWhere.menuId = finalMenuId;
        }

        const existingQR = await db.qRCode.findFirst({
            where: existingWhere,
        });

        if (existingQR) {
            return { success: false, error: `QR code for table ${tableNumber} already exists` };
        }

        // Create new QR code
        const createData: any = {
            restaurantId: finalRestaurantId,
            tableNumber: tableNumber.trim(),
            qrToken: crypto.randomUUID(),
            isActive: true,
            scanCount: 0,
        };

        if (finalMenuId) {
            createData.menuId = finalMenuId;
        }

        const created = await db.qRCode.create({
            data: createData,
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                menu: finalMenuId
                    ? {
                          select: {
                              id: true,
                              name: true,
                              restaurant: {
                                  select: {
                                      id: true,
                                      name: true,
                                  },
                              },
                          },
                      }
                    : undefined,
            },
        });

        revalidatePath('/dashboard/qr-codes');
        revalidatePath('/dashboard/restaurants');

        return { success: true, data: toQRCodeData(created as any) };
    } catch (error) {
        console.error('Error creating QR code:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create QR code',
        };
    }
}

// Update QR Code
export async function updateQRCode(
    id: string,
    data: {
        tableNumber?: string;
        isActive?: boolean;
        menuId?: string | null;
    }
): Promise<QRCodeActionResult> {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) {
            return { success: false, error: 'Authentication required' };
        }

        // Get existing QR code to check permissions
        const existingQR = await db.qRCode.findUnique({
            where: { id },
            include: {
                restaurant: { select: { id: true } },
                menu: { select: { id: true, restaurantId: true } },
            },
        });

        if (!existingQR) {
            return { success: false, error: 'QR code not found' };
        }

        // Check access permissions
        if (user.role === 'MANAGER') {
            if (user.restaurantId !== existingQR.restaurantId) {
                return { success: false, error: 'Access denied to this QR code' };
            }
        }

        // Validate menu access if changing menu
        if (data.menuId !== undefined && data.menuId !== existingQR.menuId) {
            if (data.menuId) {
                const menu = await db.menu.findUnique({
                    where: { id: data.menuId },
                    select: { id: true, restaurantId: true },
                });

                if (!menu) {
                    return { success: false, error: 'Menu not found' };
                }

                if (user.role === 'MANAGER' && user.restaurantId !== menu.restaurantId) {
                    return { success: false, error: 'Access denied to this menu' };
                }
            }
        }

        // Check for table number conflicts if changing table number
        if (data.tableNumber && data.tableNumber !== existingQR.tableNumber) {
            const existingWhere: any = {
                restaurantId: existingQR.restaurantId,
                tableNumber: data.tableNumber.trim(),
                id: { not: id },
            };

            if (data.menuId || existingQR.menuId) {
                existingWhere.menuId = data.menuId || existingQR.menuId;
            }

            const conflictingQR = await db.qRCode.findFirst({
                where: existingWhere,
            });

            if (conflictingQR) {
                return { success: false, error: `QR code for table ${data.tableNumber} already exists` };
            }
        }

        const updated = await db.qRCode.update({
            where: { id },
            data: {
                ...(data.tableNumber && { tableNumber: data.tableNumber.trim() }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
                ...(data.menuId !== undefined && { menuId: data.menuId }),
            },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                menu: data.menuId
                    ? {
                          select: {
                              id: true,
                              name: true,
                              restaurant: {
                                  select: {
                                      id: true,
                                      name: true,
                                  },
                              },
                          },
                      }
                    : undefined,
            },
        });

        revalidatePath('/dashboard/qr-codes');
        revalidatePath('/dashboard/restaurants');

        return { success: true, data: toQRCodeData(updated as any) };
    } catch (error) {
        console.error('Error updating QR code:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update QR code',
        };
    }
}

// Delete QR Code
export async function deleteQRCode(id: string): Promise<ActionResult> {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) {
            return { success: false, error: 'Authentication required' };
        }

        // Get existing QR code to check permissions
        const existingQR = await db.qRCode.findUnique({
            where: { id },
            include: {
                restaurant: { select: { id: true } },
            },
        });

        if (!existingQR) {
            return { success: false, error: 'QR code not found' };
        }

        // Check access permissions
        if (user.role === 'MANAGER' && user.restaurantId !== existingQR.restaurantId) {
            return { success: false, error: 'Access denied to this QR code' };
        }

        await db.qRCode.delete({
            where: { id },
        });

        revalidatePath('/dashboard/qr-codes');
        revalidatePath('/dashboard/restaurants');

        return { success: true };
    } catch (error) {
        console.error('Error deleting QR code:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete QR code',
        };
    }
}

// Bulk Create QR Codes
export async function bulkCreateQRCodes(
    restaurantId: string,
    menuId: string | null,
    tableNumbers: string[]
): Promise<ActionResult<{ created: number; errors: string[] }>> {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) {
            return { success: false, error: 'Authentication required' };
        }

        // Check access permissions
        if (user.role === 'MANAGER' && user.restaurantId !== restaurantId) {
            return { success: false, error: 'Access denied to this restaurant' };
        }

        // Validate menu access if provided
        if (menuId) {
            const menu = await db.menu.findUnique({
                where: { id: menuId },
                select: { id: true, restaurantId: true },
            });

            if (!menu) {
                return { success: false, error: 'Menu not found' };
            }

            if (user.role === 'MANAGER' && user.restaurantId !== menu.restaurantId) {
                return { success: false, error: 'Access denied to this menu' };
            }
        }

        const errors: string[] = [];
        let created = 0;

        for (const tableNumber of tableNumbers) {
            try {
                // Check for existing QR code
                const existingWhere: any = {
                    restaurantId,
                    tableNumber: tableNumber.trim(),
                };

                if (menuId) {
                    existingWhere.menuId = menuId;
                }

                const existingQR = await db.qRCode.findFirst({
                    where: existingWhere,
                });

                if (existingQR) {
                    errors.push(`Table ${tableNumber} already exists`);
                    continue;
                }

                // Create QR code
                const createData: any = {
                    restaurantId,
                    tableNumber: tableNumber.trim(),
                    qrToken: crypto.randomUUID(),
                    isActive: true,
                    scanCount: 0,
                };

                if (menuId) {
                    createData.menuId = menuId;
                }

                await db.qRCode.create({ data: createData });
                created++;
            } catch (error) {
                errors.push(`Failed to create table ${tableNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        if (created > 0) {
            revalidatePath('/dashboard/qr-codes');
            revalidatePath('/dashboard/restaurants');
        }

        return {
            success: true,
            data: { created, errors },
        };
    } catch (error) {
        console.error('Error bulk creating QR codes:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to bulk create QR codes',
        };
    }
}

// Get Restaurants for Selection
export async function getRestaurantsForSelection(): Promise<RestaurantListActionResult> {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) {
            return { success: false, error: 'Authentication required' };
        }

        let restaurants: RestaurantData[] = [];

        if (user.role === 'ADMIN') {
            // Admins can see all restaurants
            restaurants = await db.restaurant.findMany({
                select: {
                    id: true,
                    name: true,
                },
                orderBy: { name: 'asc' },
            });
        } else if (user.role === 'MANAGER' && user.restaurantId) {
            // Managers can only see their restaurant
            const restaurant = await db.restaurant.findUnique({
                where: { id: user.restaurantId },
                select: {
                    id: true,
                    name: true,
                },
            });

            if (restaurant) {
                restaurants = [restaurant];
            }
        }

        return { success: true, data: restaurants };
    } catch (error) {
        console.error('Error getting restaurants for selection:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get restaurants',
        };
    }
}

// Get Menus for Restaurant
export async function getMenusForRestaurant(restaurantId: string): Promise<MenuListActionResult> {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) {
            return { success: false, error: 'Authentication required' };
        }

        // Check access permissions
        if (user.role === 'MANAGER' && user.restaurantId !== restaurantId) {
            return { success: false, error: 'Access denied to this restaurant' };
        }

        const menus = await db.menu.findMany({
            where: {
                restaurantId,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                isPublished: true,
            },
            orderBy: { name: 'asc' },
        });

        return { success: true, data: menus };
    } catch (error) {
        console.error('Error getting menus for restaurant:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get menus',
        };
    }
}

// Toggle QR Code Active Status
export async function toggleQRCodeStatus(id: string): Promise<QRCodeActionResult> {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) {
            return { success: false, error: 'Authentication required' };
        }

        // Get existing QR code to check permissions
        const existingQR = await db.qRCode.findUnique({
            where: { id },
            include: {
                restaurant: { select: { id: true } },
            },
        });

        if (!existingQR) {
            return { success: false, error: 'QR code not found' };
        }

        // Check access permissions
        if (user.role === 'MANAGER' && user.restaurantId !== existingQR.restaurantId) {
            return { success: false, error: 'Access denied to this QR code' };
        }

        const updated = await db.qRCode.update({
            where: { id },
            data: { isActive: !existingQR.isActive },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                menu: existingQR.menuId
                    ? {
                          select: {
                              id: true,
                              name: true,
                              restaurant: {
                                  select: {
                                      id: true,
                                      name: true,
                                  },
                              },
                          },
                      }
                    : undefined,
            },
        });

        revalidatePath('/dashboard/qr-codes');
        revalidatePath('/dashboard/restaurants');

        return { success: true, data: toQRCodeData(updated as any) };
    } catch (error) {
        console.error('Error toggling QR code status:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to toggle QR code status',
        };
    }
}

// Get QR Code Statistics
export async function getQRCodeStats(restaurantId: string): Promise<ActionResult<{
    total: number;
    active: number;
    inactive: number;
    totalScans: number;
    lastScanned: string | null;
}>> {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) {
            return { success: false, error: 'Authentication required' };
        }

        // Check access permissions
        if (user.role === 'MANAGER' && user.restaurantId !== restaurantId) {
            return { success: false, error: 'Access denied to this restaurant' };
        }

        const [total, active, inactive, totalScans, lastScanned] = await Promise.all([
            db.qRCode.count({ where: { restaurantId } }),
            db.qRCode.count({ where: { restaurantId, isActive: true } }),
            db.qRCode.count({ where: { restaurantId, isActive: false } }),
            db.qRCode.aggregate({
                where: { restaurantId },
                _sum: { scanCount: true },
            }),
            db.qRCode.findFirst({
                where: { restaurantId },
                orderBy: { lastScanned: 'desc' },
                select: { lastScanned: true },
            }),
        ]);

        return {
            success: true,
            data: {
                total,
                active,
                inactive,
                totalScans: totalScans._sum.scanCount || 0,
                lastScanned: lastScanned?.lastScanned?.toISOString() || null,
            },
        };
    } catch (error) {
        console.error('Error getting QR code stats:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get QR code statistics',
        };
    }
} 