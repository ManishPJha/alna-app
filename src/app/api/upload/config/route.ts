import { getUploadService } from '@/lib/upload/service';
import { requireAuth } from '@/utils/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    try {
        const { error, user } = await requireAuth();
        if (error || !user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        const uploadService = getUploadService();
        const config = uploadService.getConfig();
        const availableProviders = await uploadService.getAvailableProviders();
        const health = await uploadService.getProviderHealth();

        return NextResponse.json({
            success: true,
            data: {
                config,
                availableProviders,
                health,
            },
        });
    } catch (error) {
        console.error('Config get error:', error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to get config',
                success: false,
            },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { error, user } = await requireAuth();
        if (error || !user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { defaultProvider, fallbackProvider, uploadConfig } = body;

        const uploadService = getUploadService();

        // Update configuration
        if (defaultProvider) {
            await uploadService.switchProvider(defaultProvider);
        }

        if (fallbackProvider || uploadConfig) {
            uploadService.updateConfig({
                ...(fallbackProvider && { fallbackProvider }),
                ...(uploadConfig && { upload: uploadConfig }),
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Configuration updated successfully',
        });
    } catch (error) {
        console.error('Config update error:', error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to update config',
                success: false,
            },
            { status: 500 }
        );
    }
}
