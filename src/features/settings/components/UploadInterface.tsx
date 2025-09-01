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
    Globe,
    HardDrive,
    RefreshCw,
    Server,
    Settings,
    Upload,
    XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

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

function UploadAdminInterface() {
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
                await loadConfig(); // Reload to get updated health status
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
                return <HardDrive className="w-5 h-5" />;
            case 'aws-s3':
                return <Cloud className="w-5 h-5" />;
            case 'gcs':
                return <Database className="w-5 h-5" />;
            case 'azure':
                return <Server className="w-5 h-5" />;
            case 'cloudinary':
                return <Globe className="w-5 h-5" />;
            case 'appwrite':
                return <Cloud className="w-4 h-4" />;
            default:
                return <Settings className="w-4 h-4" />;
        }
    };

    const getHealthBadge = (provider: string) => {
        const providerHealth = health[provider];
        if (!providerHealth) {
            return <Badge variant="secondary">Unknown</Badge>;
        }

        if (providerHealth.healthy) {
            return (
                <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Healthy
                </Badge>
            );
        } else {
            return (
                <Badge variant="destructive">
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
            <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                Loading configuration...
            </div>
        );
    }

    if (!config) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Failed to load upload service configuration.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">
                        Upload Service Configuration
                    </h2>
                    <p className="text-gray-600">
                        Manage file upload providers and settings
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={loadConfig}
                        variant="outline"
                        disabled={loading}
                    >
                        <RefreshCw
                            className={`w-4 h-4 mr-2 ${
                                loading ? 'animate-spin' : ''
                            }`}
                        />
                        Refresh
                    </Button>
                    <Button onClick={saveConfig} disabled={saving}>
                        {saving ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        Save Changes
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {successMessage && (
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="providers" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="providers">Providers</TabsTrigger>
                    <TabsTrigger value="settings">Upload Settings</TabsTrigger>
                    <TabsTrigger value="test">Test Upload</TabsTrigger>
                </TabsList>

                <TabsContent value="providers" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Provider Selection</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Primary Provider</Label>
                                    <Select
                                        value={config.defaultProvider}
                                        onValueChange={(value) =>
                                            setConfig({
                                                ...config,
                                                defaultProvider: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
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
                                                            {provider
                                                                .replace(
                                                                    '-',
                                                                    ' '
                                                                )
                                                                .toUpperCase()}
                                                        </div>
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Fallback Provider</Label>
                                    <Select
                                        value={config.fallbackProvider}
                                        onValueChange={(value) =>
                                            setConfig({
                                                ...config,
                                                fallbackProvider: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
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
                                                            {provider
                                                                .replace(
                                                                    '-',
                                                                    ' '
                                                                )
                                                                .toUpperCase()}
                                                        </div>
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Provider Health Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {availableProviders.map((provider) => (
                                        <div
                                            key={provider}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                {getProviderIcon(provider)}
                                                <span className="font-medium">
                                                    {provider
                                                        .replace('-', ' ')
                                                        .toUpperCase()}
                                                </span>
                                                {provider ===
                                                    config.defaultProvider && (
                                                    <Badge variant="outline">
                                                        Primary
                                                    </Badge>
                                                )}
                                                {provider ===
                                                    config.fallbackProvider && (
                                                    <Badge variant="outline">
                                                        Fallback
                                                    </Badge>
                                                )}
                                            </div>
                                            {getHealthBadge(provider)}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Provider Configuration Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {Object.entries(config.providers)
                            .filter(
                                ([_, providerConfig]) => providerConfig.enabled
                            )
                            .map(([providerType, providerConfig]) => (
                                <Card key={providerType}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            {getProviderIcon(providerType)}
                                            {providerType
                                                .replace('-', ' ')
                                                .toUpperCase()}{' '}
                                            Configuration
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
                                                const displayValue =
                                                    sensitiveKeys.some((sk) =>
                                                        key
                                                            .toLowerCase()
                                                            .includes(
                                                                sk.toLowerCase()
                                                            )
                                                    )
                                                        ? '***' +
                                                          String(value).slice(
                                                              -4
                                                          )
                                                        : String(value);

                                                return (
                                                    <div
                                                        key={key}
                                                        className="flex justify-between"
                                                    >
                                                        <span className="font-medium">
                                                            {key}:
                                                        </span>
                                                        <span className="text-gray-600">
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

                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Restrictions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Maximum File Size</Label>
                                <div className="flex items-center gap-2">
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
                                <Label>Allowed MIME Types</Label>
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
                                />
                            </div>

                            <div>
                                <Label>Allowed File Extensions</Label>
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
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="test" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Test Upload</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Select File</Label>
                                <Input
                                    type="file"
                                    onChange={(e) =>
                                        setTestFile(e.target.files?.[0] || null)
                                    }
                                    accept={config.upload.allowedMimeTypes.join(
                                        ','
                                    )}
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
                                >
                                    {testResult.success ? (
                                        <CheckCircle className="h-4 w-4" />
                                    ) : (
                                        <XCircle className="h-4 w-4" />
                                    )}
                                    <AlertDescription>
                                        {testResult.success ? (
                                            <div className="space-y-1">
                                                <div>Upload successful!</div>
                                                <div className="text-xs">
                                                    Provider:{' '}
                                                    {testResult.data.provider}
                                                </div>
                                                <div className="text-xs">
                                                    URL:{' '}
                                                    <a
                                                        href={
                                                            testResult.data.url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="underline"
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

export default React.memo(UploadAdminInterface);