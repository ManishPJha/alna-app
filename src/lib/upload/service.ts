import { defaultUploadConfig } from '@/config/upload';
import {
    DeleteResult,
    ProviderType,
    UploadError,
    UploadFile,
    UploadProvider,
    UploadResult,
    UploadServiceConfig,
} from '@/types/upload';
import { ProviderFactory } from './providers/factory';
import { UploadError as UploadException, uploadLogger } from './utils';

export class UploadService {
    private config: UploadServiceConfig;
    private primaryProvider: UploadProvider | null = null;
    private fallbackProvider: UploadProvider | null = null;

    constructor(config?: Partial<UploadServiceConfig>) {
        this.config = { ...defaultUploadConfig, ...config };
    }

    // Initialize providers on first use
    private async ensureProvidersInitialized(): Promise<void> {
        if (!this.primaryProvider) {
            try {
                this.primaryProvider = await ProviderFactory.createProvider(
                    this.config.defaultProvider
                );
                uploadLogger.info(
                    `Primary provider initialized: ${this.config.defaultProvider}`
                );
            } catch (error) {
                uploadLogger.error(
                    `Failed to initialize primary provider: ${this.config.defaultProvider}`,
                    error
                );

                // Try to initialize fallback immediately
                if (
                    this.config.fallbackProvider !== this.config.defaultProvider
                ) {
                    try {
                        this.fallbackProvider =
                            await ProviderFactory.createProvider(
                                this.config.fallbackProvider
                            );
                        this.primaryProvider = this.fallbackProvider; // Use fallback as primary
                        uploadLogger.info(
                            `Fallback provider initialized as primary: ${this.config.fallbackProvider}`
                        );
                    } catch (fallbackError) {
                        uploadLogger.error(
                            `Failed to initialize fallback provider: ${this.config.fallbackProvider}`,
                            fallbackError
                        );
                        throw new UploadException(
                            'Failed to initialize any upload provider',
                            'PROVIDER_INITIALIZATION_FAILED'
                        );
                    }
                } else {
                    throw error;
                }
            }
        }

        // Initialize fallback provider if different from primary
        if (
            !this.fallbackProvider &&
            this.config.fallbackProvider !== this.config.defaultProvider
        ) {
            try {
                this.fallbackProvider = await ProviderFactory.createProvider(
                    this.config.fallbackProvider
                );
                uploadLogger.info(
                    `Fallback provider initialized: ${this.config.fallbackProvider}`
                );
            } catch (error) {
                uploadLogger.warn(
                    `Failed to initialize fallback provider: ${this.config.fallbackProvider}`,
                    error
                );
                // Continue without fallback - not critical
            }
        }
    }

    async upload(file: UploadFile): Promise<UploadResult> {
        await this.ensureProvidersInitialized();

        const startTime = Date.now();
        uploadLogger.info('Starting file upload', {
            originalName: file.originalName,
            size: file.size,
            mimeType: file.mimeType,
            primaryProvider: this.primaryProvider?.name,
        });

        // Try primary provider first
        if (this.primaryProvider) {
            const result = await this.primaryProvider.upload(
                file,
                this.config.upload
            );

            if (result.success) {
                const duration = Date.now() - startTime;
                uploadLogger.info('Upload successful', {
                    provider: result.provider,
                    key: result.key,
                    duration,
                });
                return result;
            } else {
                uploadLogger.warn('Primary provider upload failed', {
                    provider: this.primaryProvider.name,
                    error: (result as UploadError).error,
                    code: (result as UploadError).code,
                });

                // Try fallback provider if available and different
                if (
                    this.fallbackProvider &&
                    this.fallbackProvider.name !== this.primaryProvider.name
                ) {
                    uploadLogger.info(
                        'Attempting upload with fallback provider',
                        {
                            fallbackProvider: this.fallbackProvider.name,
                        }
                    );

                    const fallbackResult = await this.fallbackProvider.upload(
                        file,
                        this.config.upload
                    );

                    if (fallbackResult.success) {
                        const duration = Date.now() - startTime;
                        uploadLogger.info('Fallback upload successful', {
                            provider: fallbackResult.provider,
                            key: fallbackResult.key,
                            duration,
                        });
                        return fallbackResult;
                    } else {
                        uploadLogger.error(
                            'Both primary and fallback providers failed',
                            {
                                primaryError: (result as UploadError).error,
                                fallbackError: (fallbackResult as UploadError)
                                    .error,
                            }
                        );
                    }
                }

                // If we get here, upload failed
                throw new UploadException(
                    (result as UploadError).error || 'Upload failed',
                    (result as UploadError).code || 'UPLOAD_FAILED'
                );
            }
        }

        throw new UploadException(
            'No upload provider available',
            'NO_PROVIDER_AVAILABLE'
        );
    }

    async delete(key: string, provider?: string): Promise<DeleteResult> {
        await this.ensureProvidersInitialized();

        uploadLogger.info('Starting file deletion', { key, provider });

        // If provider is specified, use that one
        if (provider) {
            try {
                const specificProvider = await ProviderFactory.createProvider(
                    provider as ProviderType
                );
                return await specificProvider.delete(key);
            } catch (error) {
                uploadLogger.error(
                    `Failed to delete with specified provider: ${provider}`,
                    error
                );
                return {
                    success: false,
                    key,
                    provider,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Delete failed',
                };
            }
        }

        // Otherwise try primary provider first
        if (this.primaryProvider) {
            const result = await this.primaryProvider.delete(key);

            if (result.success) {
                uploadLogger.info('Delete successful', {
                    provider: result.provider,
                    key,
                });
                return result;
            }

            // Try fallback provider if available
            if (
                this.fallbackProvider &&
                this.fallbackProvider.name !== this.primaryProvider.name
            ) {
                const fallbackResult = await this.fallbackProvider.delete(key);

                if (fallbackResult.success) {
                    uploadLogger.info('Fallback delete successful', {
                        provider: fallbackResult.provider,
                        key,
                    });
                    return fallbackResult;
                }
            }

            return result; // Return the original error
        }

        return {
            success: false,
            key,
            provider: 'unknown',
            error: 'No provider available',
        };
    }

    async getUrl(key: string, provider?: string): Promise<string> {
        await this.ensureProvidersInitialized();

        // If provider is specified, use that one
        if (provider) {
            const specificProvider = await ProviderFactory.createProvider(
                provider as ProviderType
            );
            return await specificProvider.getUrl(key);
        }

        // Otherwise use primary provider
        if (this.primaryProvider) {
            return await this.primaryProvider.getUrl(key);
        }

        throw new UploadException(
            'No provider available to generate URL',
            'NO_PROVIDER_AVAILABLE'
        );
    }

    async exists(key: string, provider?: string): Promise<boolean> {
        await this.ensureProvidersInitialized();

        // If provider is specified, use that one
        if (provider) {
            const specificProvider = await ProviderFactory.createProvider(
                provider as ProviderType
            );
            return await specificProvider.exists(key);
        }

        // Check primary provider first
        if (this.primaryProvider) {
            const exists = await this.primaryProvider.exists(key);
            if (exists) return true;

            // Check fallback provider if available
            if (
                this.fallbackProvider &&
                this.fallbackProvider.name !== this.primaryProvider.name
            ) {
                return await this.fallbackProvider.exists(key);
            }
        }

        return false;
    }

    async getMetadata(
        key: string,
        provider?: string
    ): Promise<Record<string, any> | null> {
        await this.ensureProvidersInitialized();

        // If provider is specified, use that one
        if (provider) {
            const specificProvider = await ProviderFactory.createProvider(
                provider as ProviderType
            );
            return await specificProvider.getMetadata(key);
        }

        // Try primary provider first
        if (this.primaryProvider) {
            const metadata = await this.primaryProvider.getMetadata(key);
            if (metadata) return metadata;

            // Try fallback provider if available
            if (
                this.fallbackProvider &&
                this.fallbackProvider.name !== this.primaryProvider.name
            ) {
                return await this.fallbackProvider.getMetadata(key);
            }
        }

        return null;
    }

    // Configuration management
    async switchProvider(newProvider: ProviderType): Promise<void> {
        try {
            // Test the new provider first
            await ProviderFactory.createProvider(newProvider);

            // Update configuration
            this.config.defaultProvider = newProvider;

            // Reset providers to force re-initialization
            this.primaryProvider = null;
            this.fallbackProvider = null;

            uploadLogger.info(`Provider switched to: ${newProvider}`);
        } catch (error) {
            uploadLogger.error(
                `Failed to switch to provider: ${newProvider}`,
                error
            );
            throw error;
        }
    }

    async getAvailableProviders(): Promise<ProviderType[]> {
        return await ProviderFactory.getAvailableProviders();
    }

    async getProviderHealth(): Promise<
        Record<string, { healthy: boolean; error?: string }>
    > {
        const availableProviders = await this.getAvailableProviders();
        const health: Record<string, { healthy: boolean; error?: string }> = {};

        await Promise.allSettled(
            availableProviders.map(async (provider) => {
                health[provider] = await ProviderFactory.healthCheck(provider);
            })
        );

        return health;
    }

    // Batch operations
    async uploadMultiple(
        files: UploadFile[]
    ): Promise<Array<UploadResult | UploadError>> {
        uploadLogger.info(`Starting batch upload of ${files.length} files`);

        const results = await Promise.allSettled(
            files.map((file) => this.upload(file))
        );

        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                uploadLogger.error(
                    `Batch upload failed for file ${index}`,
                    result.reason
                );
                return {
                    success: false,
                    error:
                        result.reason instanceof Error
                            ? result.reason.message
                            : 'Upload failed',
                    code: 'BATCH_UPLOAD_FAILED',
                    provider: this.primaryProvider?.name || 'unknown',
                } as UploadError;
            }
        });
    }

    async deleteMultiple(keys: string[]): Promise<DeleteResult[]> {
        uploadLogger.info(`Starting batch delete of ${keys.length} files`);

        const results = await Promise.allSettled(
            keys.map((key) => this.delete(key))
        );

        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                uploadLogger.error(
                    `Batch delete failed for key ${keys[index]}`,
                    result.reason
                );
                return {
                    success: false,
                    key: keys[index],
                    provider: this.primaryProvider?.name || 'unknown',
                    error:
                        result.reason instanceof Error
                            ? result.reason.message
                            : 'Delete failed',
                };
            }
        });
    }

    // Get current configuration
    getConfig(): UploadServiceConfig {
        return { ...this.config };
    }

    // Update configuration
    updateConfig(newConfig: Partial<UploadServiceConfig>): void {
        this.config = { ...this.config, ...newConfig };

        // Reset providers if provider configuration changed
        if (newConfig.defaultProvider || newConfig.fallbackProvider) {
            this.primaryProvider = null;
            this.fallbackProvider = null;
        }

        uploadLogger.info('Upload service configuration updated');
    }
}

// Singleton instance for global use
let uploadServiceInstance: UploadService | null = null;

export function getUploadService(
    config?: Partial<UploadServiceConfig>
): UploadService {
    if (!uploadServiceInstance) {
        uploadServiceInstance = new UploadService(config);
    }

    return uploadServiceInstance;
}

// Reset singleton (useful for testing)
export function resetUploadService(): void {
    uploadServiceInstance = null;
    ProviderFactory.clearCache();
}
