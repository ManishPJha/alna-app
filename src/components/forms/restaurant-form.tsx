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
import { timezones } from '@/lib/constants';
import { Restaurant } from '@/types/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

// Define the Zod schema for the restaurant form data.
const restaurantSchema = z.object({
    name: z.string().min(1, 'Restaurant name is required'),
    email: z
        .string()
        .email('Invalid email address')
        .optional()
        .or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    description: z.string().optional(),
    defaultLanguage: z.string(),
    timezone: z.string(),
    themeColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
});

// Infer the TypeScript type from the Zod schema.
type RestaurantFormData = z.infer<typeof restaurantSchema>;

interface RestaurantFormProps {
    restaurant?: Restaurant;
    onSubmit: (data: RestaurantFormData) => void;
    onCancel?: () => void;
    loading?: boolean;
}

// Data for language selection dropdown.
const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
];

export function RestaurantForm({
    restaurant,
    onSubmit,
    onCancel,
    loading = false,
}: RestaurantFormProps) {
    // Define the default values for the form.
    const defaultFormValues: RestaurantFormData = {
        name: restaurant?.name || '',
        email: restaurant?.email || '',
        phone: restaurant?.phone || '',
        address: restaurant?.address || '',
        description: restaurant?.description || '',
        defaultLanguage: restaurant?.defaultLanguage ?? 'en',
        timezone: restaurant?.timezone ?? 'UTC',
        themeColor: restaurant?.themeColor ?? '#4f46e5',
    };

    // Initialize react-hook-form.
    const form = useForm<RestaurantFormData>({
        resolver: zodResolver(restaurantSchema),
        defaultValues: defaultFormValues,
    });

    return (
        <div className="bg-white text-gray-900 p-3 rounded-lg">
            <FormProvider {...form}>
                <Form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    {/* Restaurant Name Field */}
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-700 font-medium">
                                    Restaurant Name *
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter restaurant name"
                                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="text-red-600" />
                            </FormItem>
                        )}
                    />

                    {/* Email and Phone Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                        Email
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="contact@restaurant.com"
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
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                        Phone
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="+1 (555) 123-4567"
                                            className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Address Field */}
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-700 font-medium">
                                    Address
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Enter full address"
                                        className="resize-none bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        rows={3}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="text-red-600" />
                            </FormItem>
                        )}
                    />

                    {/* Description Field */}
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
                                        placeholder="Brief description of the restaurant"
                                        className="resize-none bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        rows={3}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="text-red-600" />
                            </FormItem>
                        )}
                    />

                    {/* Language, Timezone, and Theme Color Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="defaultLanguage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                        Default Language
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
                            name="timezone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                        Timezone
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                                <SelectValue
                                                    placeholder="Select timezone"
                                                    className="text-gray-900"
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white border-gray-300">
                                            {timezones.map((timezone) => (
                                                <SelectItem
                                                    key={timezone.value}
                                                    value={timezone.value}
                                                    className="text-gray-900 hover:bg-indigo-50 focus:bg-indigo-50"
                                                >
                                                    {timezone.label}
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
                            name="themeColor"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                        Theme Color
                                    </FormLabel>
                                    <FormControl>
                                        <div className="flex items-center space-x-2">
                                            <Input
                                                type="color"
                                                className="w-16 h-10 p-1 border border-gray-300 rounded bg-white"
                                                {...field}
                                            />
                                            <Input
                                                type="text"
                                                placeholder="#4f46e5"
                                                className="flex-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
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
                                    {restaurant ? 'Updating...' : 'Creating...'}
                                </div>
                            ) : restaurant ? (
                                'Update Restaurant'
                            ) : (
                                'Create Restaurant'
                            )}
                        </Button>
                    </div>
                </Form>
            </FormProvider>
        </div>
    );
}
