import { ProviderType, UploadServiceConfig } from '@/types/upload';

// Default configuration - can be overridden by environment variables
export const defaultUploadConfig: UploadServiceConfig = {
    defaultProvider:
        (process.env.UPLOAD_DEFAULT_PROVIDER as ProviderType) || 'local',
    fallbackProvider:
        (process.env.UPLOAD_FALLBACK_PROVIDER as ProviderType) || 'local',

    providers: {
        local: {
            type: 'local',
            enabled: process.env.UPLOAD_LOCAL_ENABLED !== 'false',
            config: {
                uploadDir: process.env.UPLOAD_LOCAL_DIR || './uploads',
                baseUrl: process.env.UPLOAD_LOCAL_BASE_URL || '/uploads',
                publicPath:
                    process.env.UPLOAD_LOCAL_PUBLIC_PATH || '/public/uploads',
            },
        },

        // 'aws-s3': {
        //     type: 'aws-s3',
        //     enabled: process.env.UPLOAD_AWS_ENABLED === 'true',
        //     config: {
        //         region: process.env.AWS_REGION || 'us-east-1',
        //         bucket: process.env.AWS_S3_BUCKET,
        //         accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        //         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        //         cdnUrl: process.env.AWS_CLOUDFRONT_URL,
        //         publicRead: process.env.AWS_S3_PUBLIC_READ !== 'false',
        //     },
        // },

        // gcs: {
        //     type: 'gcs',
        //     enabled: process.env.UPLOAD_GCS_ENABLED === 'true',
        //     config: {
        //         projectId: process.env.GCS_PROJECT_ID,
        //         bucketName: process.env.GCS_BUCKET_NAME,
        //         keyFilename: process.env.GCS_KEY_FILE,
        //         credentials: process.env.GCS_CREDENTIALS
        //             ? JSON.parse(process.env.GCS_CREDENTIALS)
        //             : undefined,
        //         cdnUrl: process.env.GCS_CDN_URL,
        //     },
        // },

        // cloudinary: {
        //     type: 'cloudinary',
        //     enabled: process.env.UPLOAD_CLOUDINARY_ENABLED === 'true',
        //     config: {
        //         cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        //         apiKey: process.env.CLOUDINARY_API_KEY,
        //         apiSecret: process.env.CLOUDINARY_API_SECRET,
        //         folder: process.env.CLOUDINARY_FOLDER || 'uploads',
        //         secure: process.env.CLOUDINARY_SECURE !== 'false',
        //     },
        // },

        // appwrite: {
        //     type: 'appwrite',
        //     enabled: process.env.UPLOAD_APPWRITE_ENABLED === 'true',
        //     config: {
        //         endpoint: process.env.APPWRITE_ENDPOINT,
        //         projectId: process.env.APPWRITE_PROJECT_ID,
        //         apiKey: process.env.APPWRITE_API_KEY,
        //         bucketId: process.env.APPWRITE_BUCKET_ID,
        //         bucketName: process.env.APPWRITE_BUCKET_NAME,
        //         enablePreview: process.env.APPWRITE_ENABLE_PREVIEW !== 'false',
        //         permissions: process.env.APPWRITE_PERMISSIONS?.split(',') || [],
        //     },
        // },

        appwrite: {
            type: 'appwrite',
            enabled: process.env.UPLOAD_APPWRITE_ENABLED === 'true',
            config: {
                endpoint: process.env.APPWRITE_ENDPOINT,
                projectId: process.env.APPWRITE_PROJECT_ID,
                apiKey: process.env.APPWRITE_API_KEY,
                bucketId: process.env.APPWRITE_BUCKET_ID || 'default',
                cdnUrl: process.env.APPWRITE_CDN_URL,
            },
        },

        // azure: {
        //     type: 'azure',
        //     enabled: process.env.UPLOAD_AZURE_ENABLED === 'true',
        //     config: {
        //         accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
        //         accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY,
        //         containerName: process.env.AZURE_STORAGE_CONTAINER || 'uploads',
        //         cdnUrl: process.env.AZURE_CDN_URL,
        //     },
        // },
    } as unknown as any,

    upload: {
        maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '10485760'), // 10MB default
        allowedMimeTypes: process.env.UPLOAD_ALLOWED_MIME_TYPES?.split(',') || [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
            'text/csv',
            'application/json',
        ],
        allowedExtensions: process.env.UPLOAD_ALLOWED_EXTENSIONS?.split(
            ','
        ) || [
            '.jpg',
            '.jpeg',
            '.png',
            '.gif',
            '.webp',
            '.pdf',
            '.txt',
            '.csv',
            '.json',
        ],
    },
};

// Validation functions
export function validateProviderConfig(
    type: ProviderType,
    config: any
): boolean {
    switch (type) {
        case 'local':
            return config.uploadDir && config.baseUrl;

        case 'aws-s3':
            return (
                config.region &&
                config.bucket &&
                config.accessKeyId &&
                config.secretAccessKey
            );

        case 'gcs':
            return (
                config.projectId &&
                config.bucketName &&
                (config.keyFilename || config.credentials)
            );

        case 'cloudinary':
            return config.cloudName && config.apiKey && config.apiSecret;

        case 'azure':
            return (
                config.accountName && config.accountKey && config.containerName
            );

        case 'appwrite':
            return (
                config.endpoint &&
                config.projectId &&
                config.apiKey &&
                config.bucketId
            );

        default:
            return false;
    }
}

export function getProviderConfig(type: ProviderType) {
    const config = defaultUploadConfig.providers[type];
    if (!config) {
        throw new Error(`Provider ${type} not configured`);
    }

    if (!config.enabled) {
        throw new Error(`Provider ${type} is disabled`);
    }

    if (!validateProviderConfig(type, config.config)) {
        throw new Error(`Provider ${type} configuration is invalid`);
    }

    return config;
}
