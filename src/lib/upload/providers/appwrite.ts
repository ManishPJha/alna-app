import {
    DeleteResult,
    UploadConfig,
    UploadError,
    UploadFile,
    UploadProvider,
    UploadResult,
} from '@/types/upload';
import {
    generateAppwriteFileKey,
    UploadError as UploadException,
    uploadLogger,
    validateFile,
    withRetry,
} from '../utils';

export interface AppwriteProviderConfig {
    endpoint: string; // Appwrite server endpoint
    projectId: string; // Project ID
    apiKey: string; // API key with storage permissions
    bucketId: string; // Storage bucket ID
    cdnUrl?: string; // Custom CDN URL if configured
}

export class AppwriteProvider implements UploadProvider {
    readonly name = 'appwrite';
    private config: AppwriteProviderConfig;
    private baseUrl: string;

    constructor(config: AppwriteProviderConfig) {
        this.config = config;
        this.baseUrl = `${config.endpoint}/v1/storage/buckets/${config.bucketId}`;
    }

    async upload(
        file: UploadFile,
        config: UploadConfig
    ): Promise<UploadResult | UploadError> {
        try {
            // Validate file
            validateFile(file, config);

            // Generate unique key (Appwrite uses file IDs)
            const fileId =
                file.key || generateAppwriteFileKey(file.originalName);

            // Upload with retry logic
            const uploadResult = await withRetry(
                async () => {
                    const formData = new FormData();
                    formData.append('fileId', fileId);
                    formData.append(
                        'file',
                        new Blob([file.buffer], { type: file.mimeType }),
                        file.originalName
                    );

                    // // Add permissions (optional - makes file readable by all users)
                    // formData.append(
                    //     'permissions',
                    //     JSON.stringify(['read("any")'])
                    // );

                    // Add permissions as individual form fields
                    formData.append('permissions[]', 'read("any")');

                    const response = await fetch(`${this.baseUrl}/files`, {
                        method: 'POST',
                        headers: {
                            'X-Appwrite-Project': this.config.projectId,
                            'X-Appwrite-Key': this.config.apiKey,
                        },
                        body: formData,
                    });

                    if (!response.ok) {
                        const errorData = await response
                            .json()
                            .catch(() => ({}));
                        throw new Error(
                            `Appwrite upload failed: ${response.status} ${
                                response.statusText
                            } - ${errorData.message || 'Unknown error'}`
                        );
                    }

                    return await response.json();
                },
                3,
                1000
            );

            const url = await this.getUrl(fileId);

            uploadLogger.info(`File uploaded successfully to Appwrite`, {
                fileId,
                bucketId: this.config.bucketId,
                originalName: file.originalName,
                size: file.size,
                url,
            });

            return {
                success: true,
                url,
                key: fileId,
                originalName: file.originalName,
                size: file.size,
                mimeType: file.mimeType,
                provider: this.name,
                metadata: {
                    bucketId: this.config.bucketId,
                    projectId: this.config.projectId,
                    appwriteFileId: uploadResult.$id,
                    uploadedAt: uploadResult.$createdAt,
                },
            };
        } catch (error) {
            uploadLogger.error(`Appwrite upload failed`, error);

            if (error instanceof UploadException) {
                return {
                    success: false,
                    error: error.message,
                    code: error.code,
                    provider: this.name,
                };
            }

            // Handle Appwrite-specific errors
            let errorCode = 'UPLOAD_FAILED';
            let errorMessage = 'Unknown error occurred';

            if (error instanceof Error) {
                errorMessage = error.message;

                // Parse specific Appwrite errors
                if (error.message.includes('401')) {
                    errorCode = 'UNAUTHORIZED';
                    errorMessage =
                        'Invalid Appwrite API key or insufficient permissions';
                } else if (error.message.includes('404')) {
                    errorCode = 'BUCKET_NOT_FOUND';
                    errorMessage = `Appwrite bucket '${this.config.bucketId}' not found`;
                } else if (error.message.includes('413')) {
                    errorCode = 'FILE_TOO_LARGE';
                    errorMessage = 'File size exceeds Appwrite limits';
                } else if (error.message.includes('409')) {
                    errorCode = 'FILE_EXISTS';
                    errorMessage = 'File with this ID already exists';
                }
            }

            return {
                success: false,
                error: errorMessage,
                code: errorCode,
                provider: this.name,
            };
        }
    }

    async delete(key: string): Promise<DeleteResult> {
        try {
            // Check if file exists first
            const exists = await this.exists(key);
            if (!exists) {
                return {
                    success: false,
                    key,
                    provider: this.name,
                    error: 'File not found',
                };
            }

            // Delete with retry logic
            await withRetry(async () => {
                const response = await fetch(`${this.baseUrl}/files/${key}`, {
                    method: 'DELETE',
                    headers: {
                        'X-Appwrite-Project': this.config.projectId,
                        'X-Appwrite-Key': this.config.apiKey,
                    },
                });

                if (!response.ok && response.status !== 404) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(
                        `Appwrite delete failed: ${response.status} ${
                            response.statusText
                        } - ${errorData.message || 'Unknown error'}`
                    );
                }
            });

            uploadLogger.info(`File deleted successfully from Appwrite`, {
                key,
                bucketId: this.config.bucketId,
            });

            return {
                success: true,
                key,
                provider: this.name,
            };
        } catch (error) {
            uploadLogger.error(`Appwrite delete failed`, error);

            return {
                success: false,
                key,
                provider: this.name,
                error: error instanceof Error ? error.message : 'Delete failed',
            };
        }
    }

    async getUrl(key: string): Promise<string> {
        if (this.config.cdnUrl) {
            return `${this.config.cdnUrl}/files/${key}/view`;
        }

        return `${this.baseUrl}/files/${key}/view?project=${this.config.projectId}`;
    }

    async exists(key: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/files/${key}`, {
                method: 'GET',
                headers: {
                    'X-Appwrite-Project': this.config.projectId,
                    'X-Appwrite-Key': this.config.apiKey,
                },
            });

            return response.ok;
        } catch (error) {
            uploadLogger.warn(
                `Error checking if Appwrite file exists: ${key}`,
                error
            );
            return false;
        }
    }

    async getMetadata(key: string): Promise<Record<string, any> | null> {
        try {
            const response = await fetch(`${this.baseUrl}/files/${key}`, {
                method: 'GET',
                headers: {
                    'X-Appwrite-Project': this.config.projectId,
                    'X-Appwrite-Key': this.config.apiKey,
                },
            });

            if (!response.ok) {
                return null;
            }

            const fileData = await response.json();

            return {
                id: fileData.$id,
                name: fileData.name,
                signature: fileData.signature,
                mimeType: fileData.mimeType,
                sizeOriginal: fileData.sizeOriginal,
                chunksTotal: fileData.chunksTotal,
                chunksUploaded: fileData.chunksUploaded,
                createdAt: fileData.$createdAt,
                updatedAt: fileData.$updatedAt,
                permissions: fileData.$permissions,
            };
        } catch (error) {
            uploadLogger.warn(
                `Failed to get Appwrite metadata for ${key}`,
                error
            );
            return null;
        }
    }

    // Generate download URL (for private files)
    async getDownloadUrl(key: string): Promise<string> {
        return `${this.baseUrl}/files/${key}/download?project=${this.config.projectId}`;
    }

    // Generate preview URL for images
    async getPreviewUrl(
        key: string,
        width?: number,
        height?: number,
        quality?: number
    ): Promise<string> {
        const params = new URLSearchParams({
            project: this.config.projectId,
        });

        if (width) params.append('width', width.toString());
        if (height) params.append('height', height.toString());
        if (quality) params.append('quality', quality.toString());

        return `${this.baseUrl}/files/${key}/preview?${params.toString()}`;
    }

    // Batch operations
    async deleteMultiple(keys: string[]): Promise<{
        successful: string[];
        failed: Array<{ key: string; error: string }>;
    }> {
        const successful: string[] = [];
        const failed: Array<{ key: string; error: string }> = [];

        // Process in batches to avoid overwhelming Appwrite
        const batchSize = 5; // Appwrite has rate limits
        for (let i = 0; i < keys.length; i += batchSize) {
            const batch = keys.slice(i, i + batchSize);

            await Promise.allSettled(
                batch.map(async (key) => {
                    const result = await this.delete(key);
                    if (result.success) {
                        successful.push(key);
                    } else {
                        failed.push({
                            key,
                            error: result.error || 'Unknown error',
                        });
                    }
                })
            );

            // Add delay between batches to respect rate limits
            if (i + batchSize < keys.length) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }

        return { successful, failed };
    }

    // List files in bucket (with pagination)
    async listFiles(
        limit: number = 25,
        offset: number = 0
    ): Promise<{
        files: Array<{
            id: string;
            name: string;
            size: number;
            mimeType: string;
            createdAt: string;
        }>;
        total: number;
    }> {
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString(),
            });

            const response = await fetch(
                `${this.baseUrl}/files?${params.toString()}`,
                {
                    method: 'GET',
                    headers: {
                        'X-Appwrite-Project': this.config.projectId,
                        'X-Appwrite-Key': this.config.apiKey,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to list files: ${response.status} ${response.statusText}`
                );
            }

            const data = await response.json();

            return {
                files: data.files.map((file: any) => ({
                    id: file.$id,
                    name: file.name,
                    size: file.sizeOriginal,
                    mimeType: file.mimeType,
                    createdAt: file.$createdAt,
                })),
                total: data.total,
            };
        } catch (error) {
            uploadLogger.error('Failed to list Appwrite files', error);
            return { files: [], total: 0 };
        }
    }

    // Update file permissions
    async updatePermissions(
        key: string,
        permissions: string[]
    ): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/files/${key}`, {
                method: 'PUT',
                headers: {
                    'X-Appwrite-Project': this.config.projectId,
                    'X-Appwrite-Key': this.config.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    permissions,
                }),
            });

            return response.ok;
        } catch (error) {
            uploadLogger.error(
                `Failed to update permissions for ${key}`,
                error
            );
            return false;
        }
    }
}
