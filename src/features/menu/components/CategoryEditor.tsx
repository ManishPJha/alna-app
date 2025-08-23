import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MenuFormData } from '@/types/menu';
import { ChefHat, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, UseFormReturn, useFieldArray } from 'react-hook-form';
import { FormInput, FormTextarea } from './FormInput';
import { ItemEditor } from './ItemEditor';

interface CategoryEditorProps {
    categoryIndex: number;
    form: UseFormReturn<MenuFormData>;
    onDelete: () => void;
}

export function CategoryEditor({
    categoryIndex,
    form,
    onDelete,
}: CategoryEditorProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const {
        fields: itemFields,
        append: appendItem,
        remove: removeItem,
    } = useFieldArray({
        control: form.control,
        name: `categories.${categoryIndex}.items`,
    });

    const addItem = () => {
        const newItem = {
            id: `temp-item-${Date.now()}`,
            name: 'New Item',
            description: '',
            price: 0,
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: false,
            isSpicy: false,
            isAvailable: true,
            displayOrder: itemFields.length + 1,
        };
        appendItem(newItem);
    };

    return (
        <Card className="mb-6 hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            type="button"
                        >
                            <ChefHat className="w-5 h-5" />
                        </button>
                        <div className="flex-1">
                            <Controller
                                name={`categories.${categoryIndex}.name`}
                                control={form.control}
                                render={({ field }) => (
                                    <FormInput
                                        {...field}
                                        className="bg-white/10 border-white/20 text-white placeholder-white/70 font-semibold text-lg"
                                        placeholder="Category Name"
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={addItem}
                            className="text-white hover:bg-white/10"
                            type="button"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Item
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDelete}
                            className="text-white hover:bg-red-500/20"
                            type="button"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <div className="mt-3">
                    <Controller
                        name={`categories.${categoryIndex}.description`}
                        control={form.control}
                        render={({ field }) => (
                            <FormTextarea
                                {...field}
                                placeholder="Category description (optional)"
                                rows={2}
                                className="bg-white/10 border-white/20 text-white placeholder-white/70"
                            />
                        )}
                    />
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        {itemFields.length === 0 ? (
                            <div className="text-center py-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                                <ChefHat className="w-16 h-16 mx-auto mb-4 text-indigo-400" />
                                <h3 className="text-lg font-semibold text-indigo-800 mb-2">
                                    No items in this category yet
                                </h3>
                                <p className="text-indigo-600 mb-4">
                                    Start building your menu by adding your
                                    first item
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={addItem}
                                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                                    type="button"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add First Item
                                </Button>
                            </div>
                        ) : (
                            itemFields.map((item: any, itemIndex) => (
                                <ItemEditor
                                    key={item.id}
                                    itemIndex={itemIndex}
                                    categoryIndex={categoryIndex}
                                    form={form}
                                    onDelete={() => removeItem(itemIndex)}
                                />
                            ))
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
