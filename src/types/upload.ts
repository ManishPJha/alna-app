export interface UploadConfig {
    maxFileSize: number; // in bytes
    allowedMimeTypes: string[];
    allowedExtensions: string[];
}

export interface UploadResult {
    success: boolean;
    url: string;
    key: string;
    originalName: string;
    size: number;
    mimeType: string;
    provider: string;
    metadata?: Record<string, any>;
}

export interface UploadError {
    success: false;
    error: string;
    code?: string;
    provider: string;
}

export interface DeleteResult {
    success: boolean;
    key: string;
    provider: string;
    error?: string;
}

export interface UploadFile {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
    key?: string; // Optional custom key/path
}

export interface UploadProvider {
    readonly name: string;
    upload(
        file: UploadFile,
        config: UploadConfig
    ): Promise<UploadResult | UploadError>;
    delete(key: string): Promise<DeleteResult>;
    getUrl(key: string): Promise<string>;
    exists(key: string): Promise<boolean>;
    getMetadata(key: string): Promise<Record<string, any> | null>;
}

export type ProviderType =
    | 'local'
    | 'aws-s3'
    | 'gcs'
    | 'cloudinary'
    | 'azure'
    | 'appwrite';

export interface ProviderConfig {
    type: ProviderType;
    enabled: boolean;
    config: Record<string, any>;
}

export interface UploadServiceConfig {
    defaultProvider: ProviderType;
    fallbackProvider: ProviderType;
    providers: Record<ProviderType, ProviderConfig>;
    upload: UploadConfig;
}

// Database model for upload settings
export interface UploadSettings {
    id: string;
    activeProvider: ProviderType;
    fallbackProvider: ProviderType;
    providerConfigs: Record<ProviderType, any>;
    uploadConfig: UploadConfig;
    createdAt: Date;
    updatedAt: Date;
}
