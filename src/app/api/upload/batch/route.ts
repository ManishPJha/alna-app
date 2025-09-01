import { getUploadService } from '@/lib/upload/service';
import { UploadFile } from '@/types/upload';
import { requireAuth } from '@/utils/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) return error;

        const formData = await request.formData();
        const files: UploadFile[] = [];

        // Process multiple files
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('file_') && value instanceof File) {
                const buffer = Buffer.from(await value.arrayBuffer());
                files.push({
                    buffer,
                    originalName: value.name,
                    mimeType: value.type,
                    size: value.size,
                });
            }
        }

        if (files.length === 0) {
            return NextResponse.json(
                { error: 'No files provided' },
                { status: 400 }
            );
        }

        const uploadService = getUploadService();
        const results = await uploadService.uploadMultiple(files);

        const successful = results.filter((r) => r.success);
        const failed = results.filter((r) => !r.success);

        return NextResponse.json({
            success: true,
            data: {
                total: results.length,
                successful: successful.length,
                failed: failed.length,
                results,
            },
        });
    } catch (error) {
        console.error('Batch upload error:', error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Batch upload failed',
                success: false,
            },
            { status: 500 }
        );
    }
}
