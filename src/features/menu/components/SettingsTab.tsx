import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Restaurant } from '@/types/api';
import { MenuFormData } from '@/types/menu';
import { Controller, UseFormReturn } from 'react-hook-form';
import { FormInput, FormTextarea } from './FormInput';

interface SettingsTabProps {
    form: UseFormReturn<MenuFormData>;
    restaurants: Restaurant[];
}

export function SettingsTab({ form, restaurants }: SettingsTabProps) {
    return (
        <div className="p-6">
            <div className="space-y-6">
                {/* Basic Menu Info */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-800">
                            Menu Information
                        </h3>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Menu Name *
                                </label>
                                <Controller
                                    name="name"
                                    control={form.control}
                                    rules={{
                                        required: 'Menu name is required',
                                    }}
                                    render={({ field, fieldState }) => (
                                        <div>
                                            <FormInput
                                                {...field}
                                                placeholder="Menu name"
                                            />
                                            {fieldState.error && (
                                                <p className="text-red-500 text-sm mt-1">
                                                    {fieldState.error.message}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Description
                                </label>
                                <Controller
                                    name="description"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormTextarea
                                            {...field}
                                            placeholder="Brief description of your menu"
                                            rows={3}
                                        />
                                    )}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Restaurant *
                                </label>
                                <Controller
                                    name="restaurantId"
                                    control={form.control}
                                    rules={{
                                        required: 'Please select a restaurant',
                                    }}
                                    render={({ field, fieldState }) => (
                                        <div>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                                                    <SelectValue placeholder="Select restaurant" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-gray-300">
                                                    {restaurants.map(
                                                        (restaurant) => (
                                                            <SelectItem
                                                                key={
                                                                    restaurant.id
                                                                }
                                                                value={
                                                                    restaurant.id
                                                                }
                                                                className="text-gray-900 hover:bg-indigo-50"
                                                            >
                                                                {
                                                                    restaurant.name
                                                                }
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {fieldState.error && (
                                                <p className="text-red-500 text-sm mt-1">
                                                    {fieldState.error.message}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Color Theme */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-800">
                            Color Theme
                        </h3>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Primary Color
                                </label>
                                <Controller
                                    name="theme.primaryColor"
                                    control={form.control}
                                    render={({ field }) => (
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="color"
                                                value={field.value}
                                                onChange={field.onChange}
                                                className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                                            />
                                            <FormInput
                                                {...field}
                                                placeholder="#000000"
                                                className="flex-1"
                                            />
                                        </div>
                                    )}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Background Color
                                </label>
                                <Controller
                                    name="theme.backgroundColor"
                                    control={form.control}
                                    render={({ field }) => (
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="color"
                                                value={field.value}
                                                onChange={field.onChange}
                                                className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                                            />
                                            <FormInput
                                                {...field}
                                                placeholder="#ffffff"
                                                className="flex-1"
                                            />
                                        </div>
                                    )}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Accent Color
                                </label>
                                <Controller
                                    name="theme.accentColor"
                                    control={form.control}
                                    render={({ field }) => (
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="color"
                                                value={field.value}
                                                onChange={field.onChange}
                                                className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                                            />
                                            <FormInput
                                                {...field}
                                                placeholder="#ff0000"
                                                className="flex-1"
                                            />
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Typography */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-800">
                            Typography
                        </h3>
                    </CardHeader>
                    <CardContent>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Font Family
                            </label>
                            <Controller
                                name="theme.fontFamily"
                                control={form.control}
                                render={({ field }) => (
                                    <select
                                        {...field}
                                        className="w-full border border-gray-300 text-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    >
                                        <option value="Inter">
                                            Inter (Modern Sans-serif)
                                        </option>
                                        <option value="Georgia">
                                            Georgia (Classic Serif)
                                        </option>
                                        <option value="Playfair Display">
                                            Playfair Display (Elegant Serif)
                                        </option>
                                        <option value="Roboto">
                                            Roboto (Clean Sans-serif)
                                        </option>
                                        <option value="Merriweather">
                                            Merriweather (Readable Serif)
                                        </option>
                                    </select>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
