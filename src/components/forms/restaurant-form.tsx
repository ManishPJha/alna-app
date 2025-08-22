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

// Data for timezone selection dropdown.
const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
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
        <FormProvider {...form}>
            <Form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Restaurant Name Field */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Restaurant Name *</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter restaurant name"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
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
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder="contact@restaurant.com"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="+1 (555) 123-4567"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
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
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Enter full address"
                                    className="resize-none"
                                    rows={3}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Description Field */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Brief description of the restaurant"
                                    className="resize-none"
                                    rows={3}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
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
                                <FormLabel>Default Language</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {languages.map((language) => (
                                            <SelectItem
                                                key={language.value}
                                                value={language.value}
                                            >
                                                {language.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="timezone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Timezone</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select timezone" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {timezones.map((timezone) => (
                                            <SelectItem
                                                key={timezone.value}
                                                value={timezone.value}
                                            >
                                                {timezone.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="themeColor"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Theme Color</FormLabel>
                                <FormControl>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="color"
                                            className="w-16 h-10 p-1 border rounded"
                                            {...field}
                                        />
                                        <Input
                                            type="text"
                                            placeholder="#4f46e5"
                                            className="flex-1"
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-4">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={loading}>
                        {loading
                            ? 'Saving...'
                            : restaurant
                            ? 'Update Restaurant'
                            : 'Create Restaurant'}
                    </Button>
                </div>
            </Form>
        </FormProvider>
    );
}
