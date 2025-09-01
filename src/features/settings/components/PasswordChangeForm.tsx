'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePasswordAction } from '@/features/settings';
import {
    AlertCircle,
    CheckCircle,
    Eye,
    EyeOff,
    Lock,
    RefreshCw,
    Save,
} from 'lucide-react';
import { useState } from 'react';

export function PasswordChangeForm() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const result = await changePasswordAction(passwords);

            if (result.success) {
                setMessage({
                    type: 'success',
                    text: 'Password changed successfully!',
                });
                setPasswords({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
            } else {
                setMessage({
                    type: 'error',
                    text: result.error || 'Failed to change password',
                });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
        setShowPasswords((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    return (
        <Card>
            <CardHeader className="bg-alna-gradient text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Change Password
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                {message && (
                    <Alert
                        variant={
                            message.type === 'error' ? 'destructive' : 'default'
                        }
                        className={`mb-4 ${
                            message.type === 'success'
                                ? 'border-green-200 bg-green-50'
                                : ''
                        }`}
                    >
                        {message.type === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                            <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertDescription
                            className={
                                message.type === 'success'
                                    ? 'text-green-800'
                                    : ''
                            }
                        >
                            {message.text}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label
                            htmlFor="currentPassword"
                            className="text-sm font-medium text-gray-700"
                        >
                            Current Password
                        </Label>
                        <div className="relative mt-1">
                            <Input
                                id="currentPassword"
                                type={
                                    showPasswords.current ? 'text' : 'password'
                                }
                                value={passwords.currentPassword}
                                onChange={(e) =>
                                    setPasswords({
                                        ...passwords,
                                        currentPassword: e.target.value,
                                    })
                                }
                                placeholder="Enter your current password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    togglePasswordVisibility('current')
                                }
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showPasswords.current ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <Label
                            htmlFor="newPassword"
                            className="text-sm font-medium text-gray-700"
                        >
                            New Password
                        </Label>
                        <div className="relative mt-1">
                            <Input
                                id="newPassword"
                                type={showPasswords.new ? 'text' : 'password'}
                                value={passwords.newPassword}
                                onChange={(e) =>
                                    setPasswords({
                                        ...passwords,
                                        newPassword: e.target.value,
                                    })
                                }
                                placeholder="Enter your new password"
                                minLength={8}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('new')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showPasswords.new ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Password must be at least 8 characters long
                        </p>
                    </div>

                    <div>
                        <Label
                            htmlFor="confirmPassword"
                            className="text-sm font-medium text-gray-700"
                        >
                            Confirm New Password
                        </Label>
                        <div className="relative mt-1">
                            <Input
                                id="confirmPassword"
                                type={
                                    showPasswords.confirm ? 'text' : 'password'
                                }
                                value={passwords.confirmPassword}
                                onChange={(e) =>
                                    setPasswords({
                                        ...passwords,
                                        confirmPassword: e.target.value,
                                    })
                                }
                                placeholder="Confirm your new password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    togglePasswordVisibility('confirm')
                                }
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showPasswords.confirm ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={
                            loading ||
                            !passwords.currentPassword ||
                            !passwords.newPassword ||
                            !passwords.confirmPassword
                        }
                        className="w-full btn-primary flex items-center gap-2"
                    >
                        {loading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {loading ? 'Changing Password...' : 'Change Password'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
