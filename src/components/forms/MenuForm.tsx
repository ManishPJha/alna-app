'use client';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Menu, Restaurant } from '@/types/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

// Define the Zod schema for the menu form data.
const menuSchema = z.object({
    name: z.string().min(1, 'Menu name is required'),
    description: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    restaurantId: z.string().min(1, 'Restaurant selection is required'),
    isActive: z.boolean(),
    language: z.string(),
    currency: z.string(),
});

// Infer the TypeScript type from the Zod schema.
type MenuFormData = z.infer<typeof menuSchema>;

interface MenuFormProps {
    menu?: Menu;
    restaurants: Restaurant[];
    onSubmit: (data: MenuFormData) => void;
    onCancel?: () => void;
    loading?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentUser?: any;
}

// Menu categories
const menuCategories = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'appetizers', label: 'Appetizers' },
    { value: 'mains', label: 'Main Courses' },
    { value: 'desserts', label: 'Desserts' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'cocktails', label: 'Cocktails' },
    { value: 'wine', label: 'Wine List' },
    { value: 'kids', label: 'Kids Menu' },
    { value: 'specials', label: 'Daily Specials' },
    { value: 'seasonal', label: 'Seasonal Menu' },
];

// Languages
const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
];

// Currencies
const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' },
    { value: 'JPY', label: 'JPY (¥)' },
    { value: 'INR', label: 'INR (₹)' },
];

export function MenuForm({
    menu,
    restaurants,
    onSubmit,
    onCancel,
    loading = false,
}: // currentUser,
MenuFormProps) {
    // Define the default values for the form.
    const defaultFormValues: MenuFormData = {
        name: menu?.name || '',
        description: menu?.description || '',
        category: 'mains',
        restaurantId: menu?.restaurantId || '',
        isActive: menu?.isActive ?? true,
        language: 'en',
        currency: 'USD',
    };

    // Initialize react-hook-form.
    const form = useForm<MenuFormData>({
        resolver: zodResolver(menuSchema),
        defaultValues: defaultFormValues,
    });

    return (
        <div className="bg-white text-gray-900 p-6 rounded-lg">
            <FormProvider {...form}>
                <Form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    {/* Menu Name and Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                        Menu Name *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Dinner Menu, Wine List"
                                            className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                        Category *
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                                <SelectValue
                                                    placeholder="Select category"
                                                    className="text-gray-900"
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white border-gray-300">
                                            {menuCategories.map((category) => (
                                                <SelectItem
                                                    key={category.value}
                                                    value={category.value}
                                                    className="text-gray-900 hover:bg-indigo-50 focus:bg-indigo-50"
                                                >
                                                    {category.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Restaurant Selection */}
                    <FormField
                        control={form.control}
                        name="restaurantId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-700 font-medium">
                                    Restaurant *
                                </FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                            <SelectValue
                                                placeholder="Select restaurant"
                                                className="text-gray-900"
                                            />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white border-gray-300">
                                        {restaurants.map((restaurant) => (
                                            <SelectItem
                                                key={restaurant.id}
                                                value={restaurant.id}
                                                className="text-gray-900 hover:bg-indigo-50 focus:bg-indigo-50"
                                            >
                                                {restaurant.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-red-600" />
                            </FormItem>
                        )}
                    />

                    {/* Description */}
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-700 font-medium">
                                    Description
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Brief description of this menu..."
                                        className="resize-none bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        rows={3}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="text-red-600" />
                            </FormItem>
                        )}
                    />

                    {/* Language, Currency, and Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="language"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                        Language
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                                <SelectValue
                                                    placeholder="Select language"
                                                    className="text-gray-900"
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white border-gray-300">
                                            {languages.map((language) => (
                                                <SelectItem
                                                    key={language.value}
                                                    value={language.value}
                                                    className="text-gray-900 hover:bg-indigo-50 focus:bg-indigo-50"
                                                >
                                                    {language.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                        Currency
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                                <SelectValue
                                                    placeholder="Select currency"
                                                    className="text-gray-900"
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white border-gray-300">
                                            {currencies.map((currency) => (
                                                <SelectItem
                                                    key={currency.value}
                                                    value={currency.value}
                                                    className="text-gray-900 hover:bg-indigo-50 focus:bg-indigo-50"
                                                >
                                                    {currency.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                        Status
                                    </FormLabel>
                                    <Select
                                        onValueChange={(value) =>
                                            field.onChange(value === 'true')
                                        }
                                        defaultValue={field.value.toString()}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                                <SelectValue
                                                    placeholder="Select status"
                                                    className="text-gray-900"
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white border-gray-300">
                                            <SelectItem
                                                value="true"
                                                className="text-gray-900 hover:bg-indigo-50 focus:bg-indigo-50"
                                            >
                                                Active
                                            </SelectItem>
                                            <SelectItem
                                                value="false"
                                                className="text-gray-900 hover:bg-indigo-50 focus:bg-indigo-50"
                                            >
                                                Inactive
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                className="border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    {menu ? 'Updating...' : 'Creating...'}
                                </div>
                            ) : menu ? (
                                'Update Menu'
                            ) : (
                                'Create Menu'
                            )}
                        </Button>
                    </div>
                </Form>
            </FormProvider>
        </div>
    );
}
