import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    removeMenuItemImage,
    uploadMenuItemImage,
    uploadTemporaryMenuItemImage,
} from '@/features/menu';
import AppImage from '@/shared/components/ui/image';
import { MenuFormData } from '@/types/menu';
import { ChefHat, Image as ImageIcon, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState, useTransition } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { FormCheckbox, FormInput, FormTextarea } from './FormInput';

interface ItemEditorProps {
    itemIndex: number;
    categoryIndex: number;
    form: UseFormReturn<MenuFormData>;
    onDelete: () => void;
    mode?: 'edit' | 'create';
    menuItemId?: string;
    children?: React.ReactNode;
}

export function ItemEditor({
    itemIndex,
    categoryIndex,
    form,
    onDelete,
    mode = 'create',
    menuItemId,
    children,
}: ItemEditorProps) {
    const [dragActive, setDragActive] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const item = form.watch(`categories.${categoryIndex}.items.${itemIndex}`);
    const currentImageUrl = form.watch(
        `categories.${categoryIndex}.items.${itemIndex}.imageUrl`
    );

    // const handleImageUpload = async (file: File) => {
    //     if (!file) return;

    //     // Validate file type
    //     if (!file.type.startsWith('image/')) {
    //         toast.error('Please select an image file');
    //         return;
    //     }

    //     // Validate file size (max 5MB)
    //     if (file.size > 5 * 1024 * 1024) {
    //         toast.error('Image size must be less than 5MB');
    //         return;
    //     }

    //     const formData = new FormData();
    //     formData.append('file', file);

    //     startTransition(async () => {
    //         try {
    //             let result;

    //             console.log('🚀 ~ handleImageUpload ~ menuItemId:', menuItemId);
    //             if (mode === 'edit' && menuItemId) {
    //                 // For edit mode, upload and immediately update database
    //                 result = await uploadMenuItemImage(formData, menuItemId);
    //             } else {
    //                 // For create mode, just upload temporarily
    //                 result = await uploadTemporaryMenuItemImage(formData);
    //             }

    //             if (result.success && result.imageUrl) {
    //                 // Update the form with the uploaded image URL
    //                 form.setValue(
    //                     `categories.${categoryIndex}.items.${itemIndex}.imageUrl`,
    //                     result.imageUrl
    //                 );

    //                 toast.success(
    //                     mode === 'edit'
    //                         ? 'Image uploaded and saved successfully'
    //                         : 'Image uploaded successfully'
    //                 );
    //             } else {
    //                 toast.error(result.error || 'Upload failed');
    //             }
    //         } catch (error) {
    //             console.error('Image upload failed:', error);
    //             toast.error('Failed to upload image');
    //         }
    //     });
    // };

    const handleImageUpload = async (file: File) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        startTransition(async () => {
            try {
                let result;

                // Check if this is a newly created item (has temp ID) or existing item
                const isNewItem = menuItemId?.startsWith('temp-');
                const isExistingItem =
                    mode === 'edit' && menuItemId && !isNewItem;

                if (isExistingItem) {
                    // For existing items in edit mode, upload and immediately update database
                    result = await uploadMenuItemImage(formData, menuItemId);
                } else {
                    // For new items (even in edit mode) or create mode, just upload temporarily
                    result = await uploadTemporaryMenuItemImage(formData);
                }

                if (result.success && result.imageUrl) {
                    setTempImage(result.imageUrl);
                    // Update the form with the uploaded image URL
                    form.setValue(
                        `categories.${categoryIndex}.items.${itemIndex}.imageUrl`,
                        result.imageUrl
                    );

                    toast.success(
                        isExistingItem
                            ? 'Image uploaded and saved successfully'
                            : 'Image uploaded successfully'
                    );
                } else {
                    toast.error(result.error || 'Upload failed');
                }
            } catch (error) {
                console.error('Image upload failed:', error);
                toast.error('Failed to upload image');
            }
        });
    };

    // const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const file = e.target.files?.[0];
    //     if (file) {
    //         handleImageUpload(file);
    //     }
    //     // Clear the input so the same file can be selected again
    //     e.target.value = '';
    // };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // If there's an existing image, clean it up first
        if (currentImageUrl) {
            const isNewItem = menuItemId?.startsWith('temp-');
            const isExistingItem = mode === 'edit' && menuItemId && !isNewItem;

            if (isExistingItem) {
                // For existing items, remove from database (which should also clean up storage)
                try {
                    await removeMenuItemImage(menuItemId);
                } catch (error) {
                    console.warn('Failed to remove existing image:', error);
                    // Continue with upload even if removal fails
                }
            }

            // For new items with temp IDs, the old temporary image will become orphaned
            // but will be cleaned up by the storage service's garbage collection
        }

        // Upload the new image
        handleImageUpload(file);

        // Clear the input so the same file can be selected again
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file && !isPending) {
            handleImageUpload(file);
        }
    };

    // const handleRemoveImage = async () => {
    //     if (mode === 'edit' && menuItemId && currentImageUrl) {
    //         // For edit mode, remove from database
    //         startTransition(async () => {
    //             const result = await removeMenuItemImage(menuItemId);
    //             if (result.success) {
    //                 form.setValue(
    //                     `categories.${categoryIndex}.items.${itemIndex}.imageUrl`,
    //                     ''
    //                 );
    //                 toast.success('Image removed successfully');
    //             } else {
    //                 toast.error(result.error || 'Failed to remove image');
    //             }
    //         });
    //     } else {
    //         console.log('No menu item ID or current image URL');
    //         // For create mode, just clear the form field
    //         form.setValue(
    //             `categories.${categoryIndex}.items.${itemIndex}.imageUrl`,
    //             ''
    //         );
    //         toast.success('Image removed');
    //     }
    // };

    const handleRemoveImage = async () => {
        // Check if this is a newly created item (has temp ID) or existing item
        const isNewItem = menuItemId?.startsWith('temp-');
        const isExistingItem =
            mode === 'edit' && menuItemId && !isNewItem && currentImageUrl;

        if (isExistingItem) {
            // For existing items in edit mode, remove from database
            startTransition(async () => {
                const result = await removeMenuItemImage(menuItemId);
                if (result.success) {
                    form.setValue(
                        `categories.${categoryIndex}.items.${itemIndex}.imageUrl`,
                        ''
                    );
                    toast.success('Image removed successfully');
                } else {
                    toast.error(result.error || 'Failed to remove image');
                }
            });
        } else {
            // For new items (even in edit mode) or create mode, just clear the form field
            form.setValue(
                `categories.${categoryIndex}.items.${itemIndex}.imageUrl`,
                ''
            );
            toast.success('Image removed');
        }
    };

    return (
        <Card className="mb-4 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
                <div className="space-y-6">
                    {/* Header with delete button */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <ChefHat className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-700">
                                    {item.name || `Menu Item ${itemIndex + 1}`}
                                </span>
                                {mode === 'edit' && (
                                    <span className="text-xs text-gray-500">
                                        {isPending
                                            ? 'Saving...'
                                            : 'Auto-save enabled'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDelete}
                            type="button"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            disabled={isPending}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Image Upload Section */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">
                            Item Image
                            {mode === 'edit' && (
                                <span className="text-xs text-gray-500 ml-2">
                                    (Changes are saved automatically)
                                </span>
                            )}
                        </label>

                        {currentImageUrl ? (
                            <div className="relative">
                                <AppImage
                                    src={currentImageUrl}
                                    alt={item.name || 'Menu item'}
                                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                                    width={500}
                                    height={500}
                                    onError={(e) => {
                                        // Handle broken image URLs
                                        const target =
                                            e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                    }}
                                />
                                <div className="absolute top-2 right-2 flex space-x-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        type="button"
                                        disabled={isPending}
                                        className="bg-white/90 hover:bg-white shadow-sm"
                                    >
                                        <Upload className="w-4 h-4 mr-1" />
                                        {isPending ? 'Uploading...' : 'Change'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={handleRemoveImage}
                                        type="button"
                                        disabled={isPending}
                                        className="bg-red-500/90 hover:bg-red-500 shadow-sm"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                {isPending && (
                                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                        <div className="bg-white rounded-lg p-3 flex items-center space-x-2">
                                            <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                                            <span className="text-sm">
                                                Processing...
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                                    dragActive
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : isPending
                                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                                onClick={() =>
                                    !isPending && fileInputRef.current?.click()
                                }
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    if (!isPending) setDragActive(true);
                                }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={(e) => {
                                    if (!isPending) handleDrop(e);
                                }}
                            >
                                {isPending ? (
                                    <div className="space-y-2">
                                        <div className="animate-spin mx-auto w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                                        <p className="text-sm text-gray-500">
                                            {mode === 'edit'
                                                ? 'Uploading and saving...'
                                                : 'Uploading image...'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                PNG, JPG, GIF up to 5MB
                                            </p>
                                            {mode === 'edit' && (
                                                <p className="text-xs text-indigo-600 mt-1">
                                                    Image will be saved
                                                    automatically
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={isPending}
                        />
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Item Name *
                            </label>
                            <Controller
                                name={`categories.${categoryIndex}.items.${itemIndex}.name`}
                                control={form.control}
                                rules={{ required: 'Item name is required' }}
                                render={({ field, fieldState }) => (
                                    <div>
                                        <FormInput
                                            {...field}
                                            placeholder="Enter item name"
                                            className={`w-full ${
                                                fieldState.error
                                                    ? 'border-red-300'
                                                    : ''
                                            }`}
                                        />
                                        {fieldState.error && (
                                            <p className="text-xs text-red-600 mt-1">
                                                {fieldState.error.message}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Price *
                            </label>
                            <Controller
                                name={`categories.${categoryIndex}.items.${itemIndex}.price`}
                                control={form.control}
                                rules={{
                                    required: 'Price is required',
                                    min: {
                                        value: 0,
                                        message: 'Price must be positive',
                                    },
                                }}
                                render={({ field, fieldState }) => (
                                    <div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                $
                                            </span>
                                            <FormInput
                                                {...field}
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                className={`w-full pl-8 ${
                                                    fieldState.error
                                                        ? 'border-red-300'
                                                        : ''
                                                }`}
                                                // onChange={(e) =>
                                                //     field.onChange(
                                                //         parseFloat(
                                                //             e.target.value
                                                //         ) || 0
                                                //     )
                                                // }
                                            />
                                        </div>
                                        {fieldState.error && (
                                            <p className="text-xs text-red-600 mt-1">
                                                {fieldState.error.message}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Description
                        </label>
                        <Controller
                            name={`categories.${categoryIndex}.items.${itemIndex}.description`}
                            control={form.control}
                            render={({ field }) => (
                                <FormTextarea
                                    {...field}
                                    placeholder="Describe this delicious item..."
                                    rows={3}
                                    className="w-full"
                                />
                            )}
                        />
                    </div>

                    {/* Dietary Options */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-3 block">
                            Dietary Information
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Controller
                                name={`categories.${categoryIndex}.items.${itemIndex}.isVegetarian`}
                                control={form.control}
                                render={({ field }) => (
                                    <FormCheckbox
                                        {...field}
                                        checked={field.value || false}
                                        onChange={field.onChange}
                                        label="🌱 Vegetarian"
                                        id={`categories.${categoryIndex}.items.${itemIndex}.isVegetarian`}
                                    />
                                )}
                            />
                            <Controller
                                name={`categories.${categoryIndex}.items.${itemIndex}.isVegan`}
                                control={form.control}
                                render={({ field }) => (
                                    <FormCheckbox
                                        {...field}
                                        checked={field.value || false}
                                        onChange={field.onChange}
                                        label="🌿 Vegan"
                                        id={`categories.${categoryIndex}.items.${itemIndex}.isVegan`}
                                    />
                                )}
                            />
                            <Controller
                                name={`categories.${categoryIndex}.items.${itemIndex}.isGlutenFree`}
                                control={form.control}
                                render={({ field }) => (
                                    <FormCheckbox
                                        {...field}
                                        checked={field.value || false}
                                        onChange={field.onChange}
                                        label="🌾 Gluten Free"
                                        id={`categories.${categoryIndex}.items.${itemIndex}.isGlutenFree`}
                                    />
                                )}
                            />
                            <Controller
                                name={`categories.${categoryIndex}.items.${itemIndex}.isSpicy`}
                                control={form.control}
                                render={({ field }) => (
                                    <FormCheckbox
                                        {...field}
                                        checked={field.value || false}
                                        onChange={field.onChange}
                                        label="🌶️ Spicy"
                                        id={`categories.${categoryIndex}.items.${itemIndex}.isSpicy`}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <Controller
                            name={`categories.${categoryIndex}.items.${itemIndex}.isAvailable`}
                            control={form.control}
                            render={({ field }) => (
                                <FormCheckbox
                                    {...field}
                                    checked={field.value !== false}
                                    onChange={field.onChange}
                                    label="Available for ordering"
                                    id={`categories.${categoryIndex}.items.${itemIndex}.isAvailable`}
                                />
                            )}
                        />
                        <div className="flex items-center space-x-2">
                            <span
                                className={`text-xs px-3 py-1 rounded-full font-medium ${
                                    item.isAvailable !== false
                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}
                            >
                                {item.isAvailable !== false
                                    ? 'Available'
                                    : 'Unavailable'}
                            </span>
                            {isPending && (
                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            )}
                        </div>
                    </div>
                    {children}
                </div>
            </CardContent>
        </Card>
    );
}
