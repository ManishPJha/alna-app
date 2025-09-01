import {
    DeleteResult,
    UploadConfig,
    UploadError,
    UploadFile,
    UploadProvider,
    UploadResult,
} from '@/types/upload';
import fs from 'fs/promises';
import path from 'path';
import {
    generateFileKey,
    UploadError as UploadException,
    uploadLogger,
    validateFile,
} from '../utils';

export interface LocalProviderConfig {
    uploadDir: string;
    baseUrl: string;
    publicPath?: string;
}

export class LocalProvider implements UploadProvider {
    readonly name = 'local';
    private config: LocalProviderConfig;

    constructor(config: LocalProviderConfig) {
        this.config = config;
        this.ensureUploadDir();
    }

    private async ensureUploadDir(): Promise<void> {
        try {
            await fs.access(this.config.uploadDir);
        } catch {
            try {
                await fs.mkdir(this.config.uploadDir, { recursive: true });
                uploadLogger.info(
                    `Created upload directory: ${this.config.uploadDir}`
                );
            } catch (error) {
                uploadLogger.error(
                    `Failed to create upload directory: ${this.config.uploadDir}`,
                    error
                );
                throw new UploadException(
                    `Failed to create upload directory: ${this.config.uploadDir}`,
                    'DIRECTORY_ERROR',
                    this.name
                );
            }
        }
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
            const filePath = path.join(this.config.uploadDir, key);

            // Ensure directory exists for nested keys
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });

            // Write file
            await fs.writeFile(filePath, file.buffer);

            // Get file stats
            const stats = await fs.stat(filePath);

            const url = this.generateUrl(key);

            uploadLogger.info(`File uploaded successfully to local storage`, {
                key,
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
                    path: filePath,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime,
                },
            };
        } catch (error) {
            uploadLogger.error(`Local upload failed`, error);

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
            const filePath = path.join(this.config.uploadDir, key);

            // Check if file exists
            try {
                await fs.access(filePath);
            } catch {
                return {
                    success: false,
                    key,
                    provider: this.name,
                    error: 'File not found',
                };
            }

            // Delete file
            await fs.unlink(filePath);

            uploadLogger.info(`File deleted successfully from local storage`, {
                key,
            });

            return {
                success: true,
                key,
                provider: this.name,
            };
        } catch (error) {
            uploadLogger.error(`Local delete failed`, error);

            return {
                success: false,
                key,
                provider: this.name,
                error: error instanceof Error ? error.message : 'Delete failed',
            };
        }
    }

    async getUrl(key: string): Promise<string> {
        return this.generateUrl(key);
    }

    async exists(key: string): Promise<boolean> {
        try {
            const filePath = path.join(this.config.uploadDir, key);
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async getMetadata(key: string): Promise<Record<string, any> | null> {
        try {
            const filePath = path.join(this.config.uploadDir, key);
            const stats = await fs.stat(filePath);

            return {
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                isFile: stats.isFile(),
                path: filePath,
            };
        } catch {
            return null;
        }
    }

    private generateUrl(key: string): string {
        return `${this.config.baseUrl}/${key}`;
    }

    // Additional utility methods
    async cleanup(
        olderThanDays: number = 30
    ): Promise<{ deletedCount: number; errors: string[] }> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        let deletedCount = 0;
        const errors: string[] = [];

        try {
            const files = await this.listFiles(this.config.uploadDir);

            for (const file of files) {
                try {
                    const stats = await fs.stat(file);
                    if (stats.mtime < cutoffDate) {
                        await fs.unlink(file);
                        deletedCount++;
                    }
                } catch (error) {
                    errors.push(`Failed to process ${file}: ${error}`);
                }
            }

            uploadLogger.info(`Cleanup completed`, {
                deletedCount,
                errorsCount: errors.length,
            });
        } catch (error) {
            errors.push(`Cleanup failed: ${error}`);
        }

        return { deletedCount, errors };
    }

    private async listFiles(dir: string): Promise<string[]> {
        const files: string[] = [];

        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    const subFiles = await this.listFiles(fullPath);
                    files.push(...subFiles);
                } else {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            uploadLogger.warn(`Failed to list files in ${dir}`, error);
        }

        return files;
    }

    async getStorageInfo(): Promise<{ totalFiles: number; totalSize: number }> {
        let totalFiles = 0;
        let totalSize = 0;

        try {
            const files = await this.listFiles(this.config.uploadDir);

            for (const file of files) {
                try {
                    const stats = await fs.stat(file);
                    totalFiles++;
                    totalSize += stats.size;
                } catch {
                    // Skip files that can't be accessed
                }
            }
        } catch (error) {
            uploadLogger.warn('Failed to get storage info', error);
        }

        return { totalFiles, totalSize };
    }
}
