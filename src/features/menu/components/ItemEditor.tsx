import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MenuFormData } from '@/types/menu';
import { ChefHat, Trash2 } from 'lucide-react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { FormCheckbox, FormInput, FormTextarea } from './FormInput';

interface ItemEditorProps {
    itemIndex: number;
    categoryIndex: number;
    form: UseFormReturn<MenuFormData>;
    onDelete: () => void;
}

export function ItemEditor({
    itemIndex,
    categoryIndex,
    form,
    onDelete,
}: ItemEditorProps) {
    const item = form.watch(`categories.${categoryIndex}.items.${itemIndex}`);

    return (
        <Card className="mb-4 hover:shadow-xl transition-all duration-300">
            <CardContent>
                <div className="space-y-4">
                    {/* Header with delete button */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <ChefHat className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">
                                Menu Item
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDelete}
                            type="button"
                        >
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Item Name
                            </label>
                            <Controller
                                name={`categories.${categoryIndex}.items.${itemIndex}.name`}
                                control={form.control}
                                render={({ field }) => (
                                    <FormInput
                                        {...field}
                                        placeholder="Enter delicious item name..."
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Price ($)
                            </label>
                            <Controller
                                name={`categories.${categoryIndex}.items.${itemIndex}.price`}
                                control={form.control}
                                render={({ field }) => (
                                    <FormInput
                                        {...field}
                                        type="number"
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                )}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                        </label>
                        <Controller
                            name={`categories.${categoryIndex}.items.${itemIndex}.description`}
                            control={form.control}
                            render={({ field }) => (
                                <FormTextarea
                                    {...field}
                                    placeholder="Describe this amazing dish..."
                                    rows={3}
                                />
                            )}
                        />
                    </div>

                    {/* Dietary Options */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Dietary Options
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Controller
                                name={`categories.${categoryIndex}.items.${itemIndex}.isVegetarian`}
                                control={form.control}
                                render={({ field }) => (
                                    <FormCheckbox
                                        id={`veg-${itemIndex}-${categoryIndex}`}
                                        checked={field.value || false}
                                        onChange={field.onChange}
                                        label="Vegetarian"
                                    />
                                )}
                            />
                            <Controller
                                name={`categories.${categoryIndex}.items.${itemIndex}.isVegan`}
                                control={form.control}
                                render={({ field }) => (
                                    <FormCheckbox
                                        id={`vegan-${itemIndex}-${categoryIndex}`}
                                        checked={field.value || false}
                                        onChange={field.onChange}
                                        label="Vegan"
                                    />
                                )}
                            />
                            <Controller
                                name={`categories.${categoryIndex}.items.${itemIndex}.isGlutenFree`}
                                control={form.control}
                                render={({ field }) => (
                                    <FormCheckbox
                                        id={`gf-${itemIndex}-${categoryIndex}`}
                                        checked={field.value || false}
                                        onChange={field.onChange}
                                        label="Gluten-Free"
                                    />
                                )}
                            />
                            <Controller
                                name={`categories.${categoryIndex}.items.${itemIndex}.isSpicy`}
                                control={form.control}
                                render={({ field }) => (
                                    <FormCheckbox
                                        id={`spicy-${itemIndex}-${categoryIndex}`}
                                        checked={field.value || false}
                                        onChange={field.onChange}
                                        label="Spicy"
                                    />
                                )}
                            />
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <Controller
                            name={`categories.${categoryIndex}.items.${itemIndex}.isAvailable`}
                            control={form.control}
                            render={({ field }) => (
                                <FormCheckbox
                                    id={`available-${itemIndex}-${categoryIndex}`}
                                    checked={field.value ?? true}
                                    onChange={field.onChange}
                                    label="Available for ordering"
                                />
                            )}
                        />
                        <span
                            className={`text-xs px-3 py-1 rounded-full font-medium ${
                                item?.isAvailable !== false
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                        >
                            {item?.isAvailable !== false
                                ? 'Available'
                                : 'Unavailable'}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
