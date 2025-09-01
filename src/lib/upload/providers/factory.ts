import { getProviderConfig } from '@/config/upload';
import { ProviderType, UploadProvider } from '@/types/upload';
import { UploadError, uploadLogger } from '../utils';
import { AWSS3ProviderConfig } from './aws-s3';
import { LocalProvider, LocalProviderConfig } from './local';

// Import other providers as needed
import { AppwriteProvider, AppwriteProviderConfig } from './appwrite';
// import { GCSProvider } from './gcs';
// import { CloudinaryProvider } from './cloudinary';
// import { AzureProvider } from './azure';

export class ProviderFactory {
    private static instances: Map<ProviderType, UploadProvider> = new Map();

    static async createProvider(type: ProviderType): Promise<UploadProvider> {
        // Return cached instance if available
        const cachedInstance = this.instances.get(type);
        if (cachedInstance) {
            return cachedInstance;
        }

        try {
            const providerConfig = getProviderConfig(type);
            let provider: UploadProvider;

            switch (type) {
                case 'local':
                    const localConfig =
                        providerConfig.config as LocalProviderConfig;
                    if (!localConfig.uploadDir || !localConfig.baseUrl) {
                        throw new UploadError(
                            'Invalid local provider configuration',
                            'INVALID_CONFIG'
                        );
                    }
                    provider = new LocalProvider(localConfig);
                    break;

                case 'aws-s3':
                    // Lazy load AWS S3 provider
                    const awsConfig =
                        providerConfig.config as AWSS3ProviderConfig;
                    if (
                        !awsConfig.region ||
                        !awsConfig.bucket ||
                        !awsConfig.accessKeyId ||
                        !awsConfig.secretAccessKey
                    ) {
                        throw new UploadError(
                            'Invalid AWS S3 provider configuration',
                            'INVALID_CONFIG'
                        );
                    }

                    try {
                        const { AWSS3Provider } = await import('./aws-s3');
                        provider = new AWSS3Provider(awsConfig);
                    } catch (importError) {
                        uploadLogger.warn(
                            'AWS S3 provider dependencies not available, using fallback'
                        );
                        const { AWSS3ProviderFallback } = await import(
                            './aws-s3-fallback'
                        );
                        provider = new AWSS3ProviderFallback(awsConfig);
                    }
                    break;

                // case 'gcs':
                //     // Lazy load to avoid importing unless needed
                //     const { GCSProvider } = await import('./gcs');
                //     provider = new GCSProvider(providerConfig.config);
                //     break;

                // case 'cloudinary':
                //     const { CloudinaryProvider } = await import('./cloudinary');
                //     provider = new CloudinaryProvider(providerConfig.config);
                //     break;

                // case 'azure':
                //     const { AzureProvider } = await import('./azure');
                //     provider = new AzureProvider(providerConfig.config);
                //     break;

                case 'appwrite':
                    const appwriteConfig =
                        providerConfig.config as AppwriteProviderConfig;
                    if (
                        !appwriteConfig.endpoint ||
                        !appwriteConfig.projectId ||
                        !appwriteConfig.apiKey ||
                        !appwriteConfig.bucketId
                    ) {
                        throw new UploadError(
                            'Invalid Appwrite provider configuration',
                            'INVALID_CONFIG'
                        );
                    }
                    provider = new AppwriteProvider(appwriteConfig);
                    break;

                default:
                    throw new UploadError(
                        `Unknown provider type: ${type}`,
                        'UNKNOWN_PROVIDER'
                    );
            }

            // Cache the instance
            this.instances.set(type, provider);

            uploadLogger.info(`Initialized provider: ${type}`);
            return provider;
        } catch (error) {
            uploadLogger.error(`Failed to create provider: ${type}`, error);
            throw error;
        }
    }

    static async getAvailableProviders(): Promise<ProviderType[]> {
        const availableProviders: ProviderType[] = [];
        const allProviders: ProviderType[] = [
            'local',
            // 'aws-s3',
            // 'gcs',
            // 'cloudinary',
            // 'azure',
            'appwrite',
        ];

        for (const type of allProviders) {
            try {
                await this.createProvider(type);
                availableProviders.push(type);
            } catch (error) {
                uploadLogger.debug(`Provider ${type} is not available`, error);
            }
        }

        return availableProviders;
    }

    static clearCache(): void {
        this.instances.clear();
        uploadLogger.info('Provider cache cleared');
    }

    static getCachedProvider(type: ProviderType): UploadProvider | undefined {
        return this.instances.get(type);
    }

    // Health check for providers
    static async healthCheck(
        type: ProviderType
    ): Promise<{ healthy: boolean; error?: string }> {
        try {
            const provider = await this.createProvider(type);

            // Perform basic health check - try to get metadata for a non-existent file
            // This tests connectivity without side effects
            const testKey = '__health_check_test__';
            await provider.exists(testKey);

            return { healthy: true };
        } catch (error) {
            return {
                healthy: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}

// Export individual providers for direct use if needed
// export { AWSS3Provider } from './aws-s3';
export { LocalProvider } from './local';

// export const createAWSS3Provider = async (config: AWSS3ProviderConfig) => {
//     try {
//         const { AWSS3Provider } = await import('./aws-s3');
//         return new AWSS3Provider(config);
//     } catch {
//         const { AWSS3ProviderFallback } = await import('./aws-s3-fallback');
//         return new AWSS3ProviderFallback(config);
//     }
// };

// // Lazy exports for optional providers
// export const createGCSProvider = async (config: any) => {
//     const { GCSProvider } = await import('./gcs');
//     return new GCSProvider(config);
// };

// export const createCloudinaryProvider = async (config: any) => {
//     const { CloudinaryProvider } = await import('./cloudinary');
//     return new CloudinaryProvider(config);
// };

// export const createAzureProvider = async (config: any) => {
//     const { AzureProvider } = await import('./azure');
//     return new AzureProvider(config);
// };

export const createAppwriteProvider = async (
    config: AppwriteProviderConfig
) => {
    const { AppwriteProvider } = await import('./appwrite');
    return new AppwriteProvider(config);
};
