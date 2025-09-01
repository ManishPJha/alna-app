import {
    DeleteResult,
    UploadConfig,
    UploadError,
    UploadFile,
    UploadProvider,
    UploadResult,
} from '@/types/upload';
import {
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

export class AWSS3Provider implements UploadProvider {
    readonly name = 'aws-s3';
    private s3Client: S3Client;
    private config: AWSS3ProviderConfig;

    constructor(config: AWSS3ProviderConfig) {
        this.config = config;
        this.s3Client = new S3Client({
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });
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

            // Prepare upload parameters
            const uploadParams = {
                Bucket: this.config.bucket,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimeType,
                ContentLength: file.size,
                StorageClass: this.config.storageClass || 'STANDARD',
                Metadata: {
                    originalName: file.originalName,
                    uploadedAt: new Date().toISOString(),
                },
            };

            // Add ACL if public read is enabled
            if (this.config.publicRead) {
                (uploadParams as any).ACL = 'public-read';
            }

            // Upload with retry logic
            await withRetry(
                async () => {
                    const command = new PutObjectCommand(uploadParams);
                    return await this.s3Client.send(command);
                },
                3,
                1000
            );

            const url = await this.getUrl(key);

            uploadLogger.info(`File uploaded successfully to S3`, {
                key,
                bucket: this.config.bucket,
                originalName: file.originalName,
                size: file.size,
                url,
            });

            return {
                success: true,
                url,
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
            uploadLogger.error(`S3 upload failed`, error);

            if (error instanceof UploadException) {
                return {
                    success: false,
                    error: error.message,
                    code: error.code,
                    provider: this.name,
                };
            }

            // Handle AWS-specific errors
            const awsError = error as any;
            let errorCode = 'UPLOAD_FAILED';
            let errorMessage = 'Unknown error occurred';

            if (awsError.name) {
                switch (awsError.name) {
                    case 'NoSuchBucket':
                        errorCode = 'BUCKET_NOT_FOUND';
                        errorMessage = `S3 bucket '${this.config.bucket}' does not exist`;
                        break;
                    case 'AccessDenied':
                        errorCode = 'ACCESS_DENIED';
                        errorMessage = 'Access denied to S3 bucket';
                        break;
                    case 'InvalidAccessKeyId':
                        errorCode = 'INVALID_CREDENTIALS';
                        errorMessage = 'Invalid AWS credentials';
                        break;
                    case 'SignatureDoesNotMatch':
                        errorCode = 'INVALID_SIGNATURE';
                        errorMessage = 'AWS signature mismatch';
                        break;
                    default:
                        errorMessage = awsError.message || errorMessage;
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
                const command = new DeleteObjectCommand({
                    Bucket: this.config.bucket,
                    Key: key,
                });
                return await this.s3Client.send(command);
            });

            uploadLogger.info(`File deleted successfully from S3`, {
                key,
                bucket: this.config.bucket,
            });

            return {
                success: true,
                key,
                provider: this.name,
            };
        } catch (error) {
            uploadLogger.error(`S3 delete failed`, error);

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

        // Generate signed URL for private objects
        try {
            const command = new GetObjectCommand({
                Bucket: this.config.bucket,
                Key: key,
            });

            return await getSignedUrl(this.s3Client, command, {
                expiresIn: 3600, // 1 hour
            });
        } catch (error) {
            uploadLogger.error(
                `Failed to generate signed URL for ${key}`,
                error
            );
            throw new UploadException(
                'Failed to generate file URL',
                'URL_GENERATION_FAILED',
                this.name
            );
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.config.bucket,
                Key: key,
            });

            await this.s3Client.send(command);
            return true;
        } catch (error) {
            const awsError = error as any;
            if (
                awsError.name === 'NotFound' ||
                awsError.$metadata?.httpStatusCode === 404
            ) {
                return false;
            }

            // For other errors, log and assume file doesn't exist
            uploadLogger.warn(
                `Error checking if S3 object exists: ${key}`,
                error
            );
            return false;
        }
    }

    async getMetadata(key: string): Promise<Record<string, any> | null> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.config.bucket,
                Key: key,
            });

            const response = await this.s3Client.send(command);

            return {
                size: response.ContentLength,
                contentType: response.ContentType,
                lastModified: response.LastModified,
                etag: response.ETag,
                storageClass: response.StorageClass,
                metadata: response.Metadata,
                serverSideEncryption: response.ServerSideEncryption,
            };
        } catch (error) {
            uploadLogger.warn(`Failed to get S3 metadata for ${key}`, error);
            return null;
        }
    }

    // Generate presigned URL for direct uploads from frontend
    async generatePresignedUploadUrl(
        key: string,
        contentType: string,
        expiresIn: number = 3600
    ): Promise<string> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.config.bucket,
                Key: key,
                ContentType: contentType,
                ...(this.config.publicRead && { ACL: 'public-read' }),
            });

            return await getSignedUrl(this.s3Client, command, { expiresIn });
        } catch (error) {
            uploadLogger.error(
                `Failed to generate presigned upload URL for ${key}`,
                error
            );
            throw new UploadException(
                'Failed to generate presigned upload URL',
                'PRESIGNED_URL_FAILED',
                this.name
            );
        }
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

    async copyObject(
        sourceKey: string,
        destinationKey: string
    ): Promise<boolean> {
        try {
            const { CopyObjectCommand } = await import('@aws-sdk/client-s3');

            const command = new CopyObjectCommand({
                Bucket: this.config.bucket,
                CopySource: `${this.config.bucket}/${sourceKey}`,
                Key: destinationKey,
            });

            await this.s3Client.send(command);
            return true;
        } catch (error) {
            uploadLogger.error(
                `Failed to copy S3 object from ${sourceKey} to ${destinationKey}`,
                error
            );
            return false;
        }
    }
}
