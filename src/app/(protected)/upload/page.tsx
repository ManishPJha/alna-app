'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertCircle,
    CheckCircle,
    Cloud,
    Database,
    HardDrive,
    RefreshCw,
    Server,
    Settings,
    Upload,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProviderConfig {
    type: string;
    enabled: boolean;
    config: Record<string, any>;
}

interface UploadConfig {
    maxFileSize: number;
    allowedMimeTypes: string[];
    allowedExtensions: string[];
}

interface ServiceConfig {
    defaultProvider: string;
    fallbackProvider: string;
    providers: Record<string, ProviderConfig>;
    upload: UploadConfig;
}

interface ProviderHealth {
    healthy: boolean;
    error?: string;
}

export default function UploadAdminInterface() {
    const [config, setConfig] = useState<ServiceConfig | null>(null);
    const [availableProviders, setAvailableProviders] = useState<string[]>([]);
    const [health, setHealth] = useState<Record<string, ProviderHealth>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Test upload state
    const [testFile, setTestFile] = useState<File | null>(null);
    const [testUploading, setTestUploading] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/upload/config');
            const data = await response.json();

            if (data.success) {
                setConfig(data.data.config);
                setAvailableProviders(data.data.availableProviders);
                setHealth(data.data.health);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to load configuration');
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async () => {
        if (!config) return;

        try {
            setSaving(true);
            setError(null);
            setSuccessMessage(null);

            const response = await fetch('/api/upload/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    defaultProvider: config.defaultProvider,
                    fallbackProvider: config.fallbackProvider,
                    uploadConfig: config.upload,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccessMessage('Configuration saved successfully');
                await loadConfig();
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const testUpload = async () => {
        if (!testFile) return;

        try {
            setTestUploading(true);
            setTestResult(null);

            const formData = new FormData();
            formData.append('file', testFile);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            setTestResult(data);
        } catch (err) {
            setTestResult({ success: false, error: 'Upload test failed' });
        } finally {
            setTestUploading(false);
        }
    };

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'local':
                return <HardDrive className="w-4 h-4" />;
            case 'aws-s3':
                return <Cloud className="w-4 h-4 text-orange-500" />;
            case 'gcs':
                return <Cloud className="w-4 h-4 text-blue-500" />;
            case 'azure':
                return <Cloud className="w-4 h-4 text-blue-600" />;
            case 'cloudinary':
                return <Cloud className="w-4 h-4 text-purple-500" />;
            default:
                return <Server className="w-4 h-4" />;
        }
    };

    const getProviderDisplayName = (provider: string) => {
        const names: Record<string, string> = {
            local: 'Local Storage',
            'aws-s3': 'AWS S3',
            gcs: 'Google Cloud Storage',
            azure: 'Azure Blob Storage',
            cloudinary: 'Cloudinary',
        };
        return names[provider] || provider.toUpperCase();
    };

    const getHealthBadge = (provider: string) => {
        const providerHealth = health[provider];
        if (!providerHealth) {
            return (
                <Badge variant="secondary" className="text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Unknown
                </Badge>
            );
        }

        if (providerHealth.healthy) {
            return (
                <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Healthy
                </Badge>
            );
        } else {
            return (
                <Badge variant="destructive" className="text-xs">
                    <XCircle className="w-3 h-3 mr-1" />
                    Unhealthy
                </Badge>
            );
        }
    };

    const formatFileSize = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (
            Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 min-h-[400px]">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-gray-600">Loading configuration...</p>
                </div>
            </div>
        );
    }

    if (!config) {
        return (
            <Alert variant="destructive" className="m-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Failed to load upload service configuration. Please check
                    your API endpoints.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Upload Service Configuration
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage file upload providers and settings
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={loadConfig}
                        variant="outline"
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${
                                loading ? 'animate-spin' : ''
                            }`}
                        />
                        Refresh
                    </Button>
                    <Button
                        onClick={saveConfig}
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        {saving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Database className="w-4 h-4" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {successMessage && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        {successMessage}
                    </AlertDescription>
                </Alert>
            )}

            {/* Main Content */}
            <Tabs defaultValue="providers" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                        value="providers"
                        className="flex items-center gap-2"
                    >
                        <Server className="w-4 h-4" />
                        Providers
                    </TabsTrigger>
                    <TabsTrigger
                        value="settings"
                        className="flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        Settings
                    </TabsTrigger>
                    <TabsTrigger
                        value="test"
                        className="flex items-center gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        Test
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="providers" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Provider Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    Provider Selection
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-sm font-medium">
                                        Primary Provider
                                    </Label>
                                    <Select
                                        value={config.defaultProvider}
                                        onValueChange={(value) =>
                                            setConfig({
                                                ...config,
                                                defaultProvider: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            {availableProviders.map(
                                                (provider) => (
                                                    <SelectItem
                                                        key={provider}
                                                        value={provider}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {getProviderIcon(
                                                                provider
                                                            )}
                                                            {getProviderDisplayName(
                                                                provider
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium">
                                        Fallback Provider
                                    </Label>
                                    <Select
                                        value={config.fallbackProvider}
                                        onValueChange={(value) =>
                                            setConfig({
                                                ...config,
                                                fallbackProvider: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            {availableProviders.map(
                                                (provider) => (
                                                    <SelectItem
                                                        key={provider}
                                                        value={provider}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {getProviderIcon(
                                                                provider
                                                            )}
                                                            {getProviderDisplayName(
                                                                provider
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Provider Health Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Provider Health Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {availableProviders.map((provider) => (
                                        <div
                                            key={provider}
                                            className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                {getProviderIcon(provider)}
                                                <span className="font-medium">
                                                    {getProviderDisplayName(
                                                        provider
                                                    )}
                                                </span>
                                                <div className="flex gap-1">
                                                    {provider ===
                                                        config.defaultProvider && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            Primary
                                                        </Badge>
                                                    )}
                                                    {provider ===
                                                        config.fallbackProvider && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            Fallback
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            {getHealthBadge(provider)}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Provider Configuration Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {Object.entries(config.providers)
                            .filter(
                                ([_, providerConfig]) => providerConfig.enabled
                            )
                            .map(([providerType, providerConfig]) => (
                                <Card key={providerType} className="h-fit">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            {getProviderIcon(providerType)}
                                            {getProviderDisplayName(
                                                providerType
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 text-sm">
                                            {Object.entries(
                                                providerConfig.config
                                            ).map(([key, value]) => {
                                                // Hide sensitive values
                                                const sensitiveKeys = [
                                                    'accessKeyId',
                                                    'secretAccessKey',
                                                    'apiKey',
                                                    'apiSecret',
                                                    'accountKey',
                                                ];
                                                const isSensitive =
                                                    sensitiveKeys.some((sk) =>
                                                        key
                                                            .toLowerCase()
                                                            .includes(
                                                                sk.toLowerCase()
                                                            )
                                                    );
                                                const displayValue = isSensitive
                                                    ? '●●●●●●●●' +
                                                      String(value).slice(-4)
                                                    : String(value);

                                                return (
                                                    <div
                                                        key={key}
                                                        className="flex justify-between items-center py-1"
                                                    >
                                                        <span className="font-medium text-gray-600">
                                                            {key}:
                                                        </span>
                                                        <span
                                                            className="text-gray-900 text-right max-w-40 truncate"
                                                            title={
                                                                isSensitive
                                                                    ? undefined
                                                                    : String(
                                                                          value
                                                                      )
                                                            }
                                                        >
                                                            {displayValue}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    <Card className="max-w-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                Upload Restrictions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label className="text-sm font-medium">
                                    Maximum File Size
                                </Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Input
                                        type="number"
                                        value={
                                            config.upload.maxFileSize /
                                            (1024 * 1024)
                                        }
                                        onChange={(e) =>
                                            setConfig({
                                                ...config,
                                                upload: {
                                                    ...config.upload,
                                                    maxFileSize:
                                                        parseInt(
                                                            e.target.value
                                                        ) *
                                                        1024 *
                                                        1024,
                                                },
                                            })
                                        }
                                        className="w-32"
                                    />
                                    <span className="text-sm text-gray-600">
                                        MB
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Current:{' '}
                                    {formatFileSize(config.upload.maxFileSize)}
                                </p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">
                                    Allowed MIME Types
                                </Label>
                                <Input
                                    value={config.upload.allowedMimeTypes.join(
                                        ', '
                                    )}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            upload: {
                                                ...config.upload,
                                                allowedMimeTypes: e.target.value
                                                    .split(',')
                                                    .map((s) => s.trim()),
                                            },
                                        })
                                    }
                                    placeholder="image/jpeg, image/png, application/pdf"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-medium">
                                    Allowed File Extensions
                                </Label>
                                <Input
                                    value={config.upload.allowedExtensions.join(
                                        ', '
                                    )}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            upload: {
                                                ...config.upload,
                                                allowedExtensions:
                                                    e.target.value
                                                        .split(',')
                                                        .map((s) => s.trim()),
                                            },
                                        })
                                    }
                                    placeholder=".jpg, .png, .pdf"
                                    className="mt-1"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="test" className="space-y-6">
                    <Card className="max-w-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="w-5 h-5" />
                                Test Upload
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium">
                                    Select File
                                </Label>
                                <Input
                                    type="file"
                                    onChange={(e) =>
                                        setTestFile(e.target.files?.[0] || null)
                                    }
                                    accept={config.upload.allowedMimeTypes.join(
                                        ','
                                    )}
                                    className="mt-1"
                                />
                            </div>

                            <Button
                                onClick={testUpload}
                                disabled={!testFile || testUploading}
                                className="w-full"
                            >
                                {testUploading ? (
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                )}
                                {testUploading ? 'Uploading...' : 'Test Upload'}
                            </Button>

                            {testResult && (
                                <Alert
                                    variant={
                                        testResult.success
                                            ? 'default'
                                            : 'destructive'
                                    }
                                    className={
                                        testResult.success
                                            ? 'border-green-200 bg-green-50'
                                            : ''
                                    }
                                >
                                    {testResult.success ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <XCircle className="h-4 w-4" />
                                    )}
                                    <AlertDescription
                                        className={
                                            testResult.success
                                                ? 'text-green-800'
                                                : ''
                                        }
                                    >
                                        {testResult.success ? (
                                            <div className="space-y-1">
                                                <div className="font-medium">
                                                    Upload successful!
                                                </div>
                                                <div className="text-sm">
                                                    Provider:{' '}
                                                    <span className="font-mono">
                                                        {
                                                            testResult.data
                                                                .provider
                                                        }
                                                    </span>
                                                </div>
                                                <div className="text-sm">
                                                    URL:{' '}
                                                    <a
                                                        href={
                                                            testResult.data.url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="underline text-blue-600 hover:text-blue-800"
                                                    >
                                                        {testResult.data.url}
                                                    </a>
                                                </div>
                                            </div>
                                        ) : (
                                            testResult.error
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
