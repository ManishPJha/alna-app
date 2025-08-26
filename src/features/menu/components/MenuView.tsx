/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { usePublicMenu } from '@/hooks/menus/usePublicMenu';
import { Loader2 } from 'lucide-react';
import { CustomerMenuPreview } from './CustomerMenuPreview';

interface MenuViewProps {
    menuId: string;
}

export function MenuView({ menuId }: MenuViewProps) {
    const { data: menuData, isLoading, error } = usePublicMenu(menuId);

    // Mock data for testing when no data is available
    const mockMenuData = {
        id: 'mock-menu-1',
        name: 'Surati Kham',
        description:
            'Authentic Indian cuisine with traditional flavors and modern presentation',
        categories: [
            {
                id: 'cat-1',
                name: 'Tapas (Small Plates)',
                description: 'Perfect for sharing or as appetizers',
                isActive: true,
                displayOrder: 1,
                items: [
                    {
                        id: 'item-1',
                        name: 'Gambas al Ajillo',
                        description:
                            'Sizzling shrimp cooked in garlic-infused olive oil with chili flakes',
                        price: 12.0,
                        isVegetarian: true,
                        isVegan: false,
                        isGlutenFree: false,
                        isSpicy: false,
                        isAvailable: true,
                        displayOrder: 1,
                    },
                    {
                        id: 'item-2',
                        name: 'Patatas Bravas',
                        description:
                            'Crispy fried potatoes served with spicy tomato sauce and creamy aioli',
                        price: 8.0,
                        isVegetarian: false,
                        isVegan: true,
                        isGlutenFree: false,
                        isSpicy: false,
                        isAvailable: true,
                        displayOrder: 2,
                    },
                    {
                        id: 'item-3',
                        name: 'Croquetas de Jamón',
                        description:
                            'Creamy ham croquettes with a golden, crispy exterior',
                        price: 8.0,
                        isVegetarian: false,
                        isVegan: false,
                        isGlutenFree: true,
                        isSpicy: false,
                        isAvailable: true,
                        displayOrder: 3,
                    },
                    {
                        id: 'item-4',
                        name: 'Calamares a la Romana',
                        description:
                            'Lightly battered and fried calamari served with lemon and aioli',
                        price: 11.0,
                        isVegetarian: false,
                        isVegan: false,
                        isGlutenFree: true,
                        isSpicy: true,
                        isAvailable: true,
                        displayOrder: 4,
                    },
                ],
            },
        ],
        theme: {
            primaryColor: '#1f2937',
            backgroundColor: '#ffffff',
            accentColor: '#ef4444',
            fontFamily: 'Inter',
        },
    };

    if (isLoading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6 text-indigo-600" />
                        <div className="absolute inset-0 w-12 h-12 mx-auto border-4 border-indigo-100 rounded-full"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Loading Menu
                    </h3>
                    <p className="text-gray-500 text-sm">
                        Please wait while we prepare your dining experience...
                    </p>
                </div>
            </div>
        );
    }

    // Use mock data if there's an error or no data (for testing purposes)
    const displayData = menuData || mockMenuData;

    // Create a mock form object for the CustomerMenuPreview component
    const mockForm = {
        watch: () => displayData,
        getValues: () => displayData,
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
            defaultValues: displayData,
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

    return (
        <div className="w-full h-full">
            <CustomerMenuPreview form={mockForm} />
        </div>
    );
}
