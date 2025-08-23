'use client';
import { Button } from '@/components/ui/button';
import { Restaurant } from '@/types/api';
import { MenuFormData } from '@/types/menu';
import { validateBeforeSubmit, ValidationError } from '@/utils/menuValidation';
import { AlertCircle, ChefHat, Globe, Palette, Save, X } from 'lucide-react';
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { ContentTab } from './ContentTab';
import { MenuPreview } from './MenuPreview';
import { SettingsTab } from './SettingsTab';

interface MenuEditorProps {
    form: UseFormReturn<MenuFormData>;
    restaurants: Restaurant[];
    onSave: (data: MenuFormData) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
    mode: 'create' | 'edit';
}

// Validation error display component
const ValidationErrors = ({
    errors,
    onClose,
}: {
    errors: ValidationError[];
    onClose: () => void;
}) => {
    if (errors.length === 0) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-96 overflow-hidden">
                <div className="bg-red-50 px-6 py-4 border-b border-red-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <h3 className="text-lg font-semibold text-red-800">
                                Validation Errors
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-red-600 hover:text-red-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="p-6 overflow-auto max-h-80">
                    <p className="text-gray-600 mb-4">
                        Please fix the following issues before saving:
                    </p>
                    <ul className="space-y-2">
                        {errors.map((error, index) => (
                            <li
                                key={index}
                                className="flex items-start space-x-2"
                            >
                                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                                <span className="text-sm text-gray-700">
                                    {error.message}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <Button
                        onClick={onClose}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                        Got it, let me fix these
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default function MenuEditor({
    form,
    restaurants,
    onSave,
    onCancel,
    loading = false,
    mode,
}: MenuEditorProps) {
    const [activeTab, setActiveTab] = useState<'content' | 'settings'>(
        'settings'
    );
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
        []
    );
    const [showValidationErrors, setShowValidationErrors] = useState(false);

    const handleSubmit = async () => {
        const formData = form.getValues();

        console.log('Form data before validation:', formData);

        // Perform comprehensive validation
        const validation = validateBeforeSubmit(formData);

        if (!validation.isValid) {
            console.log('Validation failed:', validation.errors);

            // Show validation errors
            setValidationErrors(validation.errors);
            setShowValidationErrors(true);

            // Also show toast for immediate feedback
            toast.error(
                `Please fix ${validation.errors.length} validation error${
                    validation.errors.length > 1 ? 's' : ''
                } before saving`
            );

            // Set form errors for react-hook-form
            validation.errors.forEach((error) => {
                if (error.field.includes('.')) {
                    // Handle nested field errors
                    form.setError(error.field as any, {
                        type: 'validation',
                        message: error.message,
                    });
                }
            });

            // Switch to the appropriate tab based on errors
            const hasContentErrors = validation.errors.some(
                (e) =>
                    e.field.startsWith('categories') || e.field === 'categories'
            );
            const hasSettingsErrors = validation.errors.some(
                (e) =>
                    e.field === 'name' ||
                    e.field === 'restaurantId' ||
                    e.field.startsWith('theme')
            );

            if (hasSettingsErrors && activeTab !== 'settings') {
                setActiveTab('settings');
                toast.info(
                    'Switched to Settings tab - please check the highlighted fields'
                );
            } else if (hasContentErrors && activeTab !== 'content') {
                setActiveTab('content');
                toast.info(
                    'Switched to Content tab - please check your categories and items'
                );
            }

            return;
        }

        // Clear any previous validation errors
        setValidationErrors([]);
        form.clearErrors();

        try {
            await onSave(formData);
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save menu. Please try again.');
        }
    };

    // Real-time validation feedback
    const currentData = form.watch();
    const hasBasicInfo = currentData.name && currentData.restaurantId;
    const hasCategories =
        currentData.categories && currentData.categories.length > 0;
    const hasItems = currentData.categories?.some(
        (cat) => cat.items && cat.items.length > 0
    );

    return (
        <>
            <div className="h-full bg-gray-50 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                {mode === 'create'
                                    ? 'Create New Menu'
                                    : 'Edit Menu'}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Design your menu and see changes in real-time
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onCancel}
                                type="button"
                                disabled={loading}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                onClick={handleSubmit}
                                disabled={loading || !hasBasicInfo}
                                type="button"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Saving...' : 'Save Menu'}
                            </Button>
                        </div>
                    </div>

                    {/* Validation status bar */}
                    <div className="mt-3 flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                                <div
                                    className={`w-2 h-2 rounded-full ${
                                        hasBasicInfo
                                            ? 'bg-green-500'
                                            : 'bg-red-500'
                                    }`}
                                ></div>
                                <span
                                    className={
                                        hasBasicInfo
                                            ? 'text-green-700'
                                            : 'text-red-700'
                                    }
                                >
                                    Basic Information{' '}
                                    {hasBasicInfo ? 'Complete' : 'Required'}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div
                                    className={`w-2 h-2 rounded-full ${
                                        hasCategories
                                            ? 'bg-green-500'
                                            : 'bg-yellow-500'
                                    }`}
                                ></div>
                                <span
                                    className={
                                        hasCategories
                                            ? 'text-green-700'
                                            : 'text-yellow-700'
                                    }
                                >
                                    Categories (
                                    {currentData.categories?.length || 0})
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div
                                    className={`w-2 h-2 rounded-full ${
                                        hasItems
                                            ? 'bg-green-500'
                                            : 'bg-yellow-500'
                                    }`}
                                ></div>
                                <span
                                    className={
                                        hasItems
                                            ? 'text-green-700'
                                            : 'text-yellow-700'
                                    }
                                >
                                    Menu Items (
                                    {currentData.categories?.reduce(
                                        (total, cat) =>
                                            total + (cat.items?.length || 0),
                                        0
                                    ) || 0}
                                    )
                                </span>
                            </div>
                        </div>
                        {restaurants.length === 0 && (
                            <span className="text-amber-600 text-xs">
                                ⚠️ No restaurants available - create one first
                            </span>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Editor Panel */}
                    <div className="w-1/2 border-r border-gray-200 flex flex-col bg-white">
                        {/* Tabs */}
                        <div className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
                            <div className="flex space-x-8">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('content')}
                                    className={`pb-3 border-b-2 text-sm font-semibold transition-all ${
                                        activeTab === 'content'
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <ChefHat className="w-4 h-4 inline mr-2" />
                                    Content
                                    {!hasCategories && (
                                        <span className="ml-2 w-2 h-2 bg-yellow-500 rounded-full inline-block"></span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('settings')}
                                    className={`pb-3 border-b-2 text-sm font-semibold transition-all ${
                                        activeTab === 'settings'
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <Palette className="w-4 h-4 inline mr-2" />
                                    Settings
                                    {!hasBasicInfo && (
                                        <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-auto">
                            {activeTab === 'content' && (
                                <ContentTab form={form} />
                            )}
                            {activeTab === 'settings' && (
                                <SettingsTab
                                    form={form}
                                    restaurants={restaurants}
                                />
                            )}
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div className="w-1/2 bg-gray-50 flex flex-col">
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Live Preview
                                </h2>
                                <div className="flex items-center space-x-2 text-gray-500">
                                    <Globe className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        Customer View
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden p-4">
                            <MenuPreview form={form} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Validation Errors Modal */}
            {showValidationErrors && (
                <ValidationErrors
                    errors={validationErrors}
                    onClose={() => setShowValidationErrors(false)}
                />
            )}
        </>
    );
}
