import { Button } from '@/components/ui/button';
import { MenuFormData } from '@/types/menu';
import { ChefHat, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { CategoryEditor } from '../CategoryEditor';
import { FormInput } from '../FormInput';

interface ContentTabProps {
    form: UseFormReturn<MenuFormData>;
}

export function ContentTab({ form }: ContentTabProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const bottomRef = useRef<HTMLDivElement | null>(null);

    const {
        fields: categoryFields,
        append: appendCategory,
        remove: removeCategory,
    } = useFieldArray({
        control: form.control,
        name: 'categories',
    });

    const watchedCategories = form.watch('categories');

    const filteredCategories = useMemo(() => {
        if (!searchTerm) return watchedCategories;
        return watchedCategories.filter(
            (category) =>
                category.name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                category.description
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                category.items?.some(
                    (item) =>
                        item.name
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                        item.description
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase())
                )
        );
    }, [watchedCategories, searchTerm]);

    const addCategory = useCallback(() => {
        const newCategory = {
            id: `temp-cat-${Date.now()}`,
            name: 'New Category',
            description: '',
            displayOrder: watchedCategories.length + 1,
            isActive: true,
            items: [],
        };
        appendCategory(newCategory);
    }, [appendCategory, watchedCategories.length]);

    // 🔹 Global Add Item (adds to last category)
    const addItem = useCallback(() => {
        if (watchedCategories.length === 0) {
            // If no categories, create one first
            addCategory();
            return;
        }

        const lastCategoryIndex = watchedCategories.length - 1;
        const path = `categories.${lastCategoryIndex}.items` as const;

        form.setValue(path, [
            ...(watchedCategories[lastCategoryIndex]?.items || []),
            {
                id: `temp-item-${Date.now()}`,
                name: 'New Item',
                description: '',
                price: 0,
                isVegetarian: false,
                isVegan: false,
                isGlutenFree: false,
                isSpicy: false,
                isAvailable: true,
                displayOrder:
                    (watchedCategories[lastCategoryIndex]?.items?.length || 0) +
                    1,
            },
        ]);
    }, [watchedCategories, addCategory, form]);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [watchedCategories]);

    return (
        <div className="p-6">
            <div className="mb-6 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <FormInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search categories and items..."
                        className="pl-10"
                    />
                </div>
                <Button
                    type="button"
                    onClick={addCategory}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Category
                </Button>
            </div>

            <div className="space-y-6">
                {filteredCategories.length === 0 ? (
                    <div className="text-center py-16 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                        <ChefHat className="w-20 h-20 mx-auto mb-6 text-indigo-400" />
                        <h3 className="text-xl font-bold text-indigo-800 mb-3">
                            No categories found
                        </h3>
                        <p className="text-indigo-600 mb-6 max-w-md mx-auto">
                            {searchTerm
                                ? 'Try adjusting your search terms.'
                                : 'Start building your menu by adding your first category.'}
                        </p>
                        {!searchTerm && (
                            <Button
                                type="button"
                                onClick={addCategory}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add First Category
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {categoryFields.map((category, categoryIndex) => (
                            <CategoryEditor
                                key={category.id}
                                categoryIndex={categoryIndex}
                                form={form}
                                onDelete={() => removeCategory(categoryIndex)}
                                addItem={addItem}
                            />
                        ))}

                        {/* 🔹 Intersection Button (Bottom Add Item & Category) */}
                        <div
                            className="flex items-center space-x-2 justify-center"
                            ref={bottomRef}
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addItem}
                                className="text-black hover:bg-white/10 border-dashed"
                                type="button"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Item
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addCategory}
                                className="text-black hover:bg-white/10 border-dashed"
                                type="button"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Category
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
