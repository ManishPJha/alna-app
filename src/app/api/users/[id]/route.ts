/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@/features/auth/handlers';
import { db } from '@/lib/db';
import { requireAuth } from '@/utils/auth-utils';
import { createServiceContext } from '@/utils/service-utils';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

const { log } = createServiceContext('UserService');

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// GET /api/users/[id] - Get a single user by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { error, user: currentUser } = await requireAuth();

        if (error || !currentUser) return error;

        const { id } = await params;

        // Users can view their own profile
        // ADMINs can view any user
        // MANAGERs can view users from their restaurant
        if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
            if (currentUser.role === 'MANAGER') {
                const targetUser = await db.user.findUnique({
                    where: { id },
                    select: { restaurantId: true },
                });

                if (
                    !targetUser ||
                    targetUser.restaurantId !== currentUser.restaurantId
                ) {
                    return NextResponse.json(
                        {
                            error: 'Forbidden: You can only view users from your restaurant',
                        },
                        { status: 403 }
                    );
                }
            } else {
                return NextResponse.json(
                    { error: 'Forbidden: You can only view your own profile' },
                    { status: 403 }
                );
            }
        }

        log.info('user GET by ID', { id, requestedBy: currentUser.id });

        const user = await db.user.findUnique({
            where: { id },
            include: {
                // Include restaurant details if user is a manager
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        phone: true,
                        email: true,
                    },
                },
                // Include session count for activity tracking
                _count: {
                    select: {
                        sessions: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Remove sensitive data from response
        const { passwordHash, ...userWithoutPassword } = user;

        // Transform the response to include session count as flat property
        const response = {
            ...userWithoutPassword,
            sessionCount: user._count.sessions,
            _count: undefined, // Remove the _count object from response
        };

        return NextResponse.json(response);
    } catch (error) {
        log.error('user GET by ID error', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/users/[id] - Update a user
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { error, user: currentUser } = await requireAuth();

        if (error || !currentUser) return error;

        const { id } = await params;

        // Users can update their own profile
        // ADMINs can update any user
        // MANAGERs can update users from their restaurant (except ADMINs)
        if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
            if (currentUser.role === 'MANAGER') {
                const targetUser = await db.user.findUnique({
                    where: { id },
                    select: { restaurantId: true, role: true },
                });

                if (
                    !targetUser ||
                    targetUser.restaurantId !== currentUser.restaurantId ||
                    targetUser.role === 'ADMIN'
                ) {
                    return NextResponse.json(
                        { error: 'Forbidden: Insufficient permissions' },
                        { status: 403 }
                    );
                }
            } else {
                return NextResponse.json(
                    {
                        error: 'Forbidden: You can only update your own profile',
                    },
                    { status: 403 }
                );
            }
        }

        const body = await request.json();

        // Prevent non-admins from changing roles to ADMIN
        if (body.role === 'ADMIN' && currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Forbidden: Only admins can grant admin role' },
                { status: 403 }
            );
        }

        // Prevent MANAGERs from changing restaurantId to a different restaurant
        if (
            currentUser.role === 'MANAGER' &&
            body.restaurantId &&
            body.restaurantId !== currentUser.restaurantId
        ) {
            return NextResponse.json(
                {
                    error: 'Forbidden: You can only assign users to your restaurant',
                },
                { status: 403 }
            );
        }

        // Check if user exists
        const existingUser = await db.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Extract updatable fields from body
        const { name, email, role, restaurantId, isActive, password, image } =
            body;

        log.info('user PUT', { id, body: { ...body, password: '***' } });

        // Build update data
        const updateData: any = {
            name,
            email,
            role,
            restaurantId,
            isActive,
            image,
        };

        // Handle password update if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.passwordHash = hashedPassword;
        }

        // Update the user
        const updatedUser = await db.user.update({
            where: { id },
            data: updateData,
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                    },
                },
            },
        });

        // Remove sensitive data from response
        const { passwordHash, ...userWithoutPassword } = updatedUser;

        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        log.error('user PUT error', error);

        // Handle unique constraint violation for email
        if (
            error instanceof Error &&
            error.message.includes('Unique constraint')
        ) {
            return NextResponse.json(
                { error: 'Email already exists' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH /api/users/[id] - Partially update a user
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { error, user: currentUser } = await requireAuth();

        if (error || !currentUser) return error;

        const { id } = await params;

        // Users can update their own profile
        // ADMINs can update any user
        // MANAGERs can update users from their restaurant (except ADMINs)
        if (currentUser.id !== id && currentUser.role !== 'ADMIN') {
            if (currentUser.role === 'MANAGER') {
                const targetUser = await db.user.findUnique({
                    where: { id },
                    select: { restaurantId: true, role: true },
                });

                if (
                    !targetUser ||
                    targetUser.restaurantId !== currentUser.restaurantId ||
                    targetUser.role === 'ADMIN'
                ) {
                    return NextResponse.json(
                        { error: 'Forbidden: Insufficient permissions' },
                        { status: 403 }
                    );
                }
            } else {
                return NextResponse.json(
                    {
                        error: 'Forbidden: You can only update your own profile',
                    },
                    { status: 403 }
                );
            }
        }

        const body = await request.json();

        // Prevent non-admins from changing roles to ADMIN
        if (body.role === 'ADMIN' && currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Forbidden: Only admins can grant admin role' },
                { status: 403 }
            );
        }

        // Prevent MANAGERs from changing restaurantId to a different restaurant
        if (
            currentUser.role === 'MANAGER' &&
            body.restaurantId &&
            body.restaurantId !== currentUser.restaurantId
        ) {
            return NextResponse.json(
                {
                    error: 'Forbidden: You can only assign users to your restaurant',
                },
                { status: 403 }
            );
        }

        // Check if user exists
        const existingUser = await db.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        log.info('user PATCH', {
            id,
            body: { ...body, password: body.password ? '***' : undefined },
        });

        // Build update data dynamically based on provided fields
        const updateData: any = {};

        // List of allowed fields to update
        const allowedFields = [
            'name',
            'email',
            'role',
            'restaurantId',
            'isActive',
            'image',
        ];

        // Only include fields that are present in the request body
        allowedFields.forEach((field) => {
            if (field in body) {
                updateData[field] = body[field];
            }
        });

        // Handle password update separately if provided
        if ('password' in body && body.password) {
            const hashedPassword = await bcrypt.hash(body.password, 10);
            updateData.passwordHash = hashedPassword;
        }

        // Special handling for login tracking
        if ('lastLogin' in body) {
            updateData.lastLogin = new Date();
        }

        // Update the user with only the provided fields
        const updatedUser = await db.user.update({
            where: { id },
            data: updateData,
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                    },
                },
            },
        });

        // Remove sensitive data from response
        const { passwordHash, ...userWithoutPassword } = updatedUser;

        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        log.error('user PATCH error', error);

        // Handle unique constraint violation for email
        if (
            error instanceof Error &&
            error.message.includes('Unique constraint')
        ) {
            return NextResponse.json(
                { error: 'Email already exists' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { error, user: currentUser } = await requireAuth();

        if (error || !currentUser) return error;

        // Only ADMIN users can delete users
        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Forbidden: Only administrators can delete users' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Prevent self-deletion
        if (id === currentUser.id) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await db.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        sessions: true,
                    },
                },
            },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Prevent deletion of other ADMIN users
        if (existingUser.role === 'ADMIN') {
            return NextResponse.json(
                { error: 'Cannot delete admin users' },
                { status: 403 }
            );
        }

        log.info('user DELETE', { id, requestedBy: currentUser.id });

        // Delete the user (cascade will handle related records)
        await db.user.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: 'User deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        log.error('user DELETE error', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Additional endpoint: POST /api/users/[id]/reset-password - Reset user password
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only ADMIN or the user themselves can reset password
        const { id } = await params;
        if (session.user.role !== 'ADMIN' && session.user.id !== id) {
            return NextResponse.json(
                { error: 'Forbidden: Insufficient permissions' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { newPassword, currentPassword } = body;

        if (!newPassword) {
            return NextResponse.json(
                { error: 'New password is required' },
                { status: 400 }
            );
        }

        // If user is changing their own password, verify current password
        if (session.user.id === id && currentPassword) {
            const user = await db.user.findUnique({
                where: { id },
                select: { passwordHash: true },
            });

            if (user?.passwordHash) {
                const isValidPassword = await bcrypt.compare(
                    currentPassword,
                    user.passwordHash
                );
                if (!isValidPassword) {
                    return NextResponse.json(
                        { error: 'Current password is incorrect' },
                        { status: 400 }
                    );
                }
            }
        }

        log.info('user reset password', { id });

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        await db.user.update({
            where: { id },
            data: { passwordHash: hashedPassword },
        });

        return NextResponse.json(
            { message: 'Password reset successfully' },
            { status: 200 }
        );
    } catch (error) {
        log.error('user reset password error', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
