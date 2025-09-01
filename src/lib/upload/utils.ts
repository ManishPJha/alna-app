import { UploadConfig, UploadFile } from '@/types/upload';
import { randomUUID } from 'crypto';
import path from 'path';

export class UploadError extends Error {
    constructor(
        message: string,
        public code?: string,
        public provider?: string
    ) {
        super(message);
        this.name = 'UploadError';
    }
}

export function generateFileKey(originalName: string, prefix?: string): string {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const timestamp = Date.now();
    const uuid = randomUUID().split('-')[0];

    const fileName = `${sanitizedName}_${timestamp}_${uuid}${ext}`;

    return prefix ? `${prefix}/${fileName}` : fileName;
}

// Appwrite-specific file key generator (max 36 chars, strict validation)
export function generateAppwriteFileKey(originalName?: string): string {
    // Use UUID for Appwrite to ensure it's always valid and unique
    const uuid = randomUUID().replace(/-/g, '');

    // If we have an original name, try to preserve the extension
    if (originalName) {
        const ext = path
            .extname(originalName)
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]/g, '');
        if (ext && uuid.length + ext.length + 1 <= 36) {
            return `${uuid.substring(0, 36 - ext.length - 1)}.${ext}`;
        }
    }

    // Fallback to just UUID (32 chars, always valid)
    return uuid.substring(0, 32);
}

export function validateFile(file: UploadFile, config: UploadConfig): void {
    // Check file size
    if (file.size > config.maxFileSize) {
        throw new UploadError(
            `File size ${file.size} exceeds maximum allowed size ${config.maxFileSize}`,
            'FILE_TOO_LARGE'
        );
    }

    // Check MIME type
    if (!config.allowedMimeTypes.includes(file.mimeType)) {
        throw new UploadError(
            `MIME type ${file.mimeType} is not allowed`,
            'INVALID_MIME_TYPE'
        );
    }

    // Check file extension
    const ext = path.extname(file.originalName).toLowerCase();
    if (!config.allowedExtensions.includes(ext)) {
        throw new UploadError(
            `File extension ${ext} is not allowed`,
            'INVALID_EXTENSION'
        );
    }

    // Check for empty files
    if (file.size === 0) {
        throw new UploadError('Empty files are not allowed', 'EMPTY_FILE');
    }
}

export function sanitizeFileName(fileName: string): string {
    // Remove or replace dangerous characters
    return fileName
        .replace(/[<>:"/\\|?*]/g, '_') // Replace dangerous chars
        .replace(/\s+/g, '_') // Replace spaces
        .replace(/_{2,}/g, '_') // Replace multiple underscores
        .toLowerCase();
}

export function getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.csv': 'text/csv',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4',
        '.mp3': 'audio/mpeg',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

export function formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

export function isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
}

export function isVideoFile(mimeType: string): boolean {
    return mimeType.startsWith('video/');
}

export function isDocumentFile(mimeType: string): boolean {
    return [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv',
    ].includes(mimeType);
}

// Retry utility for failed uploads
export async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            if (attempt === maxRetries) {
                throw lastError;
            }

            // Exponential backoff
            const waitTime = delay * Math.pow(2, attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
    }

    throw lastError!;
}

// Create a logger specifically for upload operations
export const uploadLogger = {
    info: (message: string, metadata?: any) => {
        console.log(
            `[UPLOAD] ${message}`,
            metadata ? JSON.stringify(metadata) : ''
        );
    },
    error: (message: string, error?: Error | any) => {
        console.error(`[UPLOAD ERROR] ${message}`, error);
    },
    warn: (message: string, metadata?: any) => {
        console.warn(
            `[UPLOAD WARN] ${message}`,
            metadata ? JSON.stringify(metadata) : ''
        );
    },
    debug: (message: string, metadata?: any) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(
                `[UPLOAD DEBUG] ${message}`,
                metadata ? JSON.stringify(metadata) : ''
            );
        }
    },
};
