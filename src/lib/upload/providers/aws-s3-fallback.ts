// src/lib/upload/providers/aws-s3-fallback.ts
import {
    DeleteResult,
    UploadConfig,
    UploadError,
    UploadFile,
    UploadProvider,
    UploadResult,
} from '@/types/upload';
import { createHash, createHmac } from 'crypto';
import {
    generateFileKey,
    UploadError as UploadException,
    uploadLogger,
    validateFile,
    withRetry,
} from '../utils';

export interface AWSS3ProviderConfig {
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    cdnUrl?: string;
    publicRead?: boolean;
    storageClass?:
        | 'STANDARD'
        | 'REDUCED_REDUNDANCY'
        | 'STANDARD_IA'
        | 'ONEZONE_IA'
        | 'INTELLIGENT_TIERING'
        | 'GLACIER';
}

export class AWSS3ProviderFallback implements UploadProvider {
    readonly name = 'aws-s3-fallback';
    private config: AWSS3ProviderConfig;

    constructor(config: AWSS3ProviderConfig) {
        this.config = config;
    }

    async upload(
        file: UploadFile,
        config: UploadConfig
    ): Promise<UploadResult | UploadError> {
        try {
            // Validate file
            validateFile(file, config);

            // Generate unique key
            const key = file.key || generateFileKey(file.originalName);

            // Upload with retry logic using fetch
            await withRetry(
                async () => {
                    const url = this.getS3Url(key);
                    const headers = this.createS3Headers(
                        'PUT',
                        key,
                        file.buffer,
                        file.mimeType
                    );

                    const response = await fetch(url, {
                        method: 'PUT',
                        headers,
                        body: new Uint8Array(file.buffer), // Convert Buffer to Uint8Array
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(
                            `S3 upload failed: ${response.status} ${response.statusText} - ${errorText}`
                        );
                    }
                },
                3,
                1000
            );

            const publicUrl = await this.getUrl(key);

            uploadLogger.info(`File uploaded successfully to S3 (fallback)`, {
                key,
                bucket: this.config.bucket,
                originalName: file.originalName,
                size: file.size,
                url: publicUrl,
            });

            return {
                success: true,
                url: publicUrl,
                key,
                originalName: file.originalName,
                size: file.size,
                mimeType: file.mimeType,
                provider: this.name,
                metadata: {
                    bucket: this.config.bucket,
                    region: this.config.region,
                    storageClass: this.config.storageClass || 'STANDARD',
                    uploadedAt: new Date().toISOString(),
                },
            };
        } catch (error) {
            uploadLogger.error(`S3 fallback upload failed`, error);

            if (error instanceof UploadException) {
                return {
                    success: false,
                    error: error.message,
                    code: error.code,
                    provider: this.name,
                };
            }

            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                code: 'UPLOAD_FAILED',
                provider: this.name,
            };
        }
    }

    async delete(key: string): Promise<DeleteResult> {
        try {
            // Check if object exists first
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
                const url = this.getS3Url(key);
                const headers = this.createS3Headers('DELETE', key);

                const response = await fetch(url, {
                    method: 'DELETE',
                    headers,
                });

                if (!response.ok && response.status !== 404) {
                    const errorText = await response.text();
                    throw new Error(
                        `S3 delete failed: ${response.status} ${response.statusText} - ${errorText}`
                    );
                }
            });

            uploadLogger.info(`File deleted successfully from S3 (fallback)`, {
                key,
                bucket: this.config.bucket,
            });

            return {
                success: true,
                key,
                provider: this.name,
            };
        } catch (error) {
            uploadLogger.error(`S3 fallback delete failed`, error);

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
            return `${this.config.cdnUrl}/${key}`;
        }

        if (this.config.publicRead) {
            return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
        }

        // Generate signed URL for private objects (valid for 1 hour)
        return this.generateSignedUrl(key, 3600);
    }

    async exists(key: string): Promise<boolean> {
        try {
            const url = this.getS3Url(key);
            const headers = this.createS3Headers('HEAD', key);

            const response = await fetch(url, {
                method: 'HEAD',
                headers,
            });

            return response.ok;
        } catch (error) {
            uploadLogger.warn(
                `Error checking if S3 object exists: ${key}`,
                error
            );
            return false;
        }
    }

    async getMetadata(key: string): Promise<Record<string, any> | null> {
        try {
            const url = this.getS3Url(key);
            const headers = this.createS3Headers('HEAD', key);

            const response = await fetch(url, {
                method: 'HEAD',
                headers,
            });

            if (!response.ok) {
                return null;
            }

            return {
                size: parseInt(response.headers.get('content-length') || '0'),
                contentType: response.headers.get('content-type'),
                lastModified: response.headers.get('last-modified'),
                etag: response.headers.get('etag'),
                storageClass: response.headers.get('x-amz-storage-class'),
            };
        } catch (error) {
            uploadLogger.warn(`Failed to get S3 metadata for ${key}`, error);
            return null;
        }
    }

    // Private helper methods for AWS signature generation
    private getS3Url(key: string): string {
        return `https://${this.config.bucket}.s3.${
            this.config.region
        }.amazonaws.com/${encodeURIComponent(key)}`;
    }

    private createS3Headers(
        method: string,
        key: string,
        body?: Buffer,
        contentType?: string
    ): Record<string, string> {
        const date = new Date().toUTCString();
        const headers: Record<string, string> = {
            Host: `${this.config.bucket}.s3.${this.config.region}.amazonaws.com`,
            Date: date,
        };

        if (contentType) {
            headers['Content-Type'] = contentType;
        }

        if (this.config.publicRead && method === 'PUT') {
            headers['x-amz-acl'] = 'public-read';
        }

        if (this.config.storageClass && method === 'PUT') {
            headers['x-amz-storage-class'] = this.config.storageClass;
        }

        // Create AWS signature
        const signature = this.createSignature(method, key, headers, body);
        headers[
            'Authorization'
        ] = `AWS ${this.config.accessKeyId}:${signature}`;

        return headers;
    }

    private createSignature(
        method: string,
        key: string,
        headers: Record<string, string>,
        body?: Buffer
    ): string {
        // AWS Signature Version 2
        const contentMd5 = body
            ? createHash('md5').update(body).digest('base64')
            : '';
        const contentType = headers['Content-Type'] || '';
        const date = headers['Date'];

        // Canonicalized AMZ headers
        const amzHeaders = Object.entries(headers)
            .filter(([k]) => k.toLowerCase().startsWith('x-amz-'))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k.toLowerCase()}:${v}`)
            .join('\n');

        const canonicalizedResource = `/${this.config.bucket}/${key}`;

        const stringToSign = [
            method,
            contentMd5,
            contentType,
            date,
            amzHeaders,
            canonicalizedResource,
        ]
            .filter(Boolean)
            .join('\n');

        return createHmac('sha1', this.config.secretAccessKey)
            .update(stringToSign)
            .digest('base64');
    }

    private generateSignedUrl(key: string, expiresIn: number): string {
        const expires = Math.floor(Date.now() / 1000) + expiresIn;
        const stringToSign = `GET\n\n\n${expires}\n/${this.config.bucket}/${key}`;

        const signature = createHmac('sha1', this.config.secretAccessKey)
            .update(stringToSign)
            .digest('base64');

        const encodedSignature = encodeURIComponent(signature);

        return `https://${this.config.bucket}.s3.${
            this.config.region
        }.amazonaws.com/${encodeURIComponent(key)}?AWSAccessKeyId=${
            this.config.accessKeyId
        }&Expires=${expires}&Signature=${encodedSignature}`;
    }

    // Batch operations
    async deleteMultiple(keys: string[]): Promise<{
        successful: string[];
        failed: Array<{ key: string; error: string }>;
    }> {
        const successful: string[] = [];
        const failed: Array<{ key: string; error: string }> = [];

        // Process in batches to avoid overwhelming S3
        const batchSize = 10;
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
        }

        return { successful, failed };
    }
}
