import { getUploadService } from '@/lib/upload/service';
import { UploadFile } from '@/types/upload';
import { requireAuth } from '@/utils/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) return error;

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Convert File to UploadFile
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadFile: UploadFile = {
            buffer,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            key: formData.get('key') as string | undefined,
        };

        // Get upload service and upload file
        const uploadService = getUploadService();
        console.log('🚀 ~ POST ~ uploadService:', uploadService.getConfig());
        const result = await uploadService.upload(uploadFile);

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Upload failed',
                success: false,
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { error, user } = await requireAuth();
        if (error || !user) return error;

        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');
        const provider = searchParams.get('provider');

        if (!key) {
            return NextResponse.json(
                { error: 'No key provided' },
                { status: 400 }
            );
        }

        const uploadService = getUploadService();
        const result = await uploadService.delete(key, provider || undefined);

        return NextResponse.json({
            success: result.success,
            data: result,
        });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Delete failed',
                success: false,
            },
            { status: 500 }
        );
    }
}
