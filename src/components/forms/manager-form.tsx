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
import { Restaurant, User } from '@/types/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

// Define the Zod schema for the manager form data.
const managerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .optional(),
    role: z.enum(['ADMIN', 'MANAGER']),
    restaurantId: z.string().optional(),
    isActive: z.boolean(),
});

// Infer the TypeScript type from the Zod schema.
type ManagerFormData = z.infer<typeof managerSchema>;

interface ManagerFormProps {
    manager?: User;
    restaurants: Restaurant[];
    onSubmit: (data: ManagerFormData) => void;
    onCancel?: () => void;
    loading?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentUser?: any;
}

export function ManagerForm({
    manager,
    restaurants,
    onSubmit,
    onCancel,
    loading = false,
    currentUser,
}: ManagerFormProps) {
    // Define the default values for the form.
    const defaultFormValues: ManagerFormData = {
        name: manager?.name || '',
        email: manager?.email || '',
        password: undefined,
        role: manager?.role || 'MANAGER',
        restaurantId: manager?.restaurantId || undefined,
        isActive: manager?.isActive ?? true,
    };

    // Initialize react-hook-form.
    const form = useForm<ManagerFormData>({
        resolver: zodResolver(managerSchema),
        defaultValues: defaultFormValues,
    });

    const handleSubmit = (data: ManagerFormData) => {
        // Remove password field if it's empty during edit
        if (manager && !data.password) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, ...dataWithoutPassword } = data;
            onSubmit(dataWithoutPassword as ManagerFormData);
        } else {
            onSubmit(data);
        }
    };

    return (
        <div className="bg-white text-gray-900 p-6 rounded-lg">
            <FormProvider {...form}>
                <Form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-6"
                >
                    {/* Name and Email Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                        Full Name *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter full name"
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
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                        Email Address *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="manager@example.com"
                                            className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Password Field (only show for new users) */}
                    {!manager && (
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                        Password *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Enter secure password"
                                            className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />
                    )}

                    {/* Role and Restaurant Assignment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                        Role
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={currentUser?.role !== 'ADMIN'}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                                <SelectValue
                                                    placeholder="Select role"
                                                    className="text-gray-900"
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white border-gray-300">
                                            <SelectItem
                                                value="MANAGER"
                                                className="text-gray-900 hover:bg-indigo-50 focus:bg-indigo-50"
                                            >
                                                Manager
                                            </SelectItem>
                                            {currentUser?.role === 'ADMIN' && (
                                                <SelectItem
                                                    value="ADMIN"
                                                    className="text-gray-900 hover:bg-indigo-50 focus:bg-indigo-50"
                                                >
                                                    Admin
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="restaurantId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                        Restaurant Assignment
                                    </FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            // Handle the special "unassigned" case
                                            field.onChange(
                                                value === 'unassigned'
                                                    ? undefined
                                                    : value
                                            );
                                        }}
                                        defaultValue={
                                            field.value || 'unassigned'
                                        }
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                                <SelectValue
                                                    placeholder="Select restaurant (optional)"
                                                    className="text-gray-900"
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white border-gray-300">
                                            <SelectItem
                                                value="unassigned"
                                                className="text-gray-900 hover:bg-indigo-50 focus:bg-indigo-50"
                                            >
                                                Unassigned
                                            </SelectItem>
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
                    </div>

                    {/* Status Field */}
                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-700 font-medium">
                                    Account Status
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
                                    {manager ? 'Updating...' : 'Creating...'}
                                </div>
                            ) : manager ? (
                                'Update Manager'
                            ) : (
                                'Create Manager'
                            )}
                        </Button>
                    </div>
                </Form>
            </FormProvider>
        </div>
    );
}
