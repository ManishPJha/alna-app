/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { usePublicMenu } from '@/hooks/menus/usePublicMenu';
import { AlertCircle, Loader2 } from 'lucide-react';
import { CustomerMenuPreview } from './CustomerMenuPreview';

interface MenuViewProps {
    menuId: string;
}

export function MenuView({ menuId }: MenuViewProps) {
    const { data: menuData, isLoading, error } = usePublicMenu(menuId);

    if (isLoading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="text-center p-8">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        Loading Menu
                    </h3>
                    <p className="text-gray-500 text-sm">
                        Please wait while we prepare your dining experience...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !menuData) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Menu Not Available
                        </h2>
                        <p className="text-gray-600 mb-6">
                            The menu you&apos;re looking for is currently
                            unavailable or doesn&apos;t exist. This could be
                            because the menu is not published or has been
                            removed.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                            >
                                Try Again
                            </button>
                            <p className="text-sm text-gray-500">
                                If this problem persists, please contact the
                                restaurant directly.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Create a mock form object that the CustomerMenuPreview expects
    const createMockForm = (data: any) => {
        return {
            watch: () => ({
                id: data.id,
                name: data.name,
                description: data.description,
                restaurantId: data.restaurant?.id || 'unknown',
                isActive: true,
                categories: data.categories || [],
                faqs: data.faqs || [],
                theme: data.theme || {
                    primaryColor: '#1f2937',
                    backgroundColor: '#ffffff',
                    accentColor: '#ef4444',
                    fontFamily: 'Inter',
                },
            }),
            getValues: () => ({
                id: data.id,
                name: data.name,
                description: data.description,
                restaurantId: data.restaurant?.id || 'unknown',
                isActive: true,
                categories: data.categories || [],
                faqs: data.faqs || [],
                theme: data.theme || {
                    primaryColor: '#1f2937',
                    backgroundColor: '#ffffff',
                    accentColor: '#ef4444',
                    fontFamily: 'Inter',
                },
            }),
            getFieldState: () => ({
                invalid: false,
                isTouched: false,
                isDirty: false,
                error: undefined,
            }),
            setError: () => {},
            clearErrors: () => {},
            setValue: () => {},
            trigger: () => Promise.resolve(true),
            formState: {
                errors: {},
                isDirty: false,
                isValid: true,
                isSubmitting: false,
                isValidating: false,
                isSubmitted: false,
                isSubmitSuccessful: false,
                submitCount: 0,
                touchedFields: {},
                dirtyFields: {},
                validatingFields: {},
                defaultValues: undefined,
            },
            reset: () => {},
            handleSubmit: () => () => {},
            unregister: () => {},
            control: {} as any,
            register: () => ({
                name: '',
                onChange: () => {},
                onBlur: () => {},
                ref: () => {},
            }),
            setFocus: () => {},
            resetField: () => {},
        } as any;
    };

    const mockForm = createMockForm(menuData);

    return (
        <div className="w-full h-full">
            <CustomerMenuPreview form={mockForm} />
        </div>
    );
}
