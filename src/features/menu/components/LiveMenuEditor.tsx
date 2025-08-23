'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Menu, MenuItem, Restaurant } from '@/types/api';
import {
    ChefHat,
    Flame,
    Globe,
    Leaf,
    Palette,
    Plus,
    Save,
    Search,
    Trash2,
    Wheat,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, UseFormReturn, useFieldArray } from 'react-hook-form';

// Form data interface
interface MenuFormData {
    name: string;
    description: string;
    restaurantId: string;
    isActive: boolean;
    categories: any[];
    theme: {
        primaryColor: string;
        backgroundColor: string;
        accentColor: string;
        fontFamily: string;
    };
}

// Input Components matching your project style with form integration
const FormInput = ({
    value,
    onChange,
    placeholder = '',
    type = 'text',
    className = '',
    ...props
}: {
    value: string | number;
    onChange: (value: any) => void;
    placeholder?: string;
    type?: string;
    className?: string;
    [key: string]: any;
}) => (
    <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-gray-300 text-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${className}`}
        placeholder={placeholder}
        {...props}
    />
);

const FormTextarea = ({
    value,
    onChange,
    placeholder = '',
    rows = 3,
    className = '',
    ...props
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
    [key: string]: any;
}) => (
    <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`w-full border border-gray-300 text-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none ${className}`}
        placeholder={placeholder}
        {...props}
    />
);

const FormCheckbox = ({
    checked,
    onChange,
    label,
    id,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    id: string;
}) => (
    <label htmlFor={id} className="flex items-center space-x-2 cursor-pointer">
        <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
        />
        <span className="text-sm text-gray-700 font-medium">{label}</span>
    </label>
);

// Card Components using your project's style
const Card = ({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <div
        className={`bg-white rounded-2xl shadow-lg border border-gray-100 ${className}`}
    >
        {children}
    </div>
);

const CardHeader = ({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
        {children}
    </div>
);

const CardContent = ({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) => <div className={`px-6 py-4 ${className}`}>{children}</div>;

// Dietary Tags Component
const DietaryTags = ({ item }: { item: MenuItem }) => {
    const tags = [];
    if (item.isVegetarian)
        tags.push({
            label: 'Vegetarian',
            className: 'bg-green-100 text-green-800 border border-green-200',
            icon: <Leaf className="w-3 h-3" />,
        });
    if (item.isVegan)
        tags.push({
            label: 'Vegan',
            className: 'bg-blue-100 text-blue-800 border border-blue-200',
            icon: <Leaf className="w-3 h-3" />,
        });
    if (item.isGlutenFree)
        tags.push({
            label: 'Gluten-Free',
            className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
            icon: <Wheat className="w-3 h-3" />,
        });
    if (item.isSpicy)
        tags.push({
            label: 'Spicy',
            className: 'bg-red-100 text-red-800 border border-red-200',
            icon: <Flame className="w-3 h-3" />,
        });
    return (
        <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag, index) => (
                <span
                    key={index}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tag.className}`}
                >
                    {tag.icon}
                    <span className="ml-1">{tag.label}</span>
                </span>
            ))}
        </div>
    );
};

// Menu Preview Component
const MenuPreview = ({ form }: { form: UseFormReturn<MenuFormData> }) => {
    const menuData = form.watch();
    const theme = menuData.theme;

    return (
        <div
            className="h-full overflow-auto rounded-2xl border border-gray-200 p-8"
            style={{
                backgroundColor: theme.backgroundColor,
                fontFamily: theme.fontFamily,
            }}
        >
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1
                        className="text-4xl font-bold mb-3"
                        style={{ color: theme.primaryColor }}
                    >
                        {menuData.name || 'Menu Name'}
                    </h1>
                    {menuData.description && (
                        <p className="text-lg text-gray-600 leading-relaxed">
                            {menuData.description}
                        </p>
                    )}
                </div>
                {/* Categories */}
                {menuData.categories
                    ?.filter((cat: any) => cat.isActive)
                    .map((category: any) => (
                        <div key={category.id} className="mb-10">
                            <div className="mb-6">
                                <h2
                                    className="text-3xl font-bold mb-3"
                                    style={{ color: theme.primaryColor }}
                                >
                                    {category.name}
                                </h2>
                                {category.description && (
                                    <p className="text-gray-600 text-lg leading-relaxed">
                                        {category.description}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-6">
                                {category.items
                                    ?.filter((item: any) => item.isAvailable)
                                    ?.sort(
                                        (a: any, b: any) =>
                                            a.displayOrder - b.displayOrder
                                    )
                                    ?.map((item: any) => (
                                        <div
                                            key={item.id}
                                            className="border-b border-gray-200 pb-6 last:border-b-0"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 pr-6">
                                                    <h3
                                                        className="text-xl font-semibold mb-2"
                                                        style={{
                                                            color: theme.primaryColor,
                                                        }}
                                                    >
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-gray-600 leading-relaxed mb-2">
                                                        {item.description}
                                                    </p>
                                                    <DietaryTags item={item} />
                                                </div>
                                                <div className="text-right">
                                                    <span
                                                        className="text-2xl font-bold"
                                                        style={{
                                                            color: theme.accentColor,
                                                        }}
                                                    >
                                                        $
                                                        {item.price?.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                {(!menuData.categories ||
                    menuData.categories.filter((cat: any) => cat.isActive)
                        .length === 0) && (
                    <div className="text-center py-16">
                        <ChefHat className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">
                            No menu items yet
                        </h3>
                        <p className="text-gray-500">
                            Start adding categories and items to see your menu
                            preview
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Item Editor Component
const ItemEditor = ({
    item,
    itemIndex,
    categoryIndex,
    form,
    onDelete,
}: {
    item: any;
    itemIndex: number;
    categoryIndex: number;
    form: UseFormReturn<MenuFormData>;
    onDelete: () => void;
}) => {
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
                        <Button variant="ghost" size="sm" onClick={onDelete}>
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
                                        onChange={(value) =>
                                            field.onChange(
                                                parseFloat(value) || 0
                                            )
                                        }
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
                                        id={`veg-${item.id}`}
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
                                        id={`vegan-${item.id}`}
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
                                        id={`gf-${item.id}`}
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
                                        id={`spicy-${item.id}`}
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
                                    id={`available-${item.id}`}
                                    checked={field.value ?? true}
                                    onChange={field.onChange}
                                    label="Available for ordering"
                                />
                            )}
                        />
                        <span
                            className={`text-xs px-3 py-1 rounded-full font-medium ${
                                item.isAvailable
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                        >
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Category Editor Component
const CategoryEditor = ({
    category,
    categoryIndex,
    form,
    onDeleteCategory,
    onAddItem,
}: {
    category: any;
    categoryIndex: number;
    form: UseFormReturn<MenuFormData>;
    onDeleteCategory: () => void;
    onAddItem: () => void;
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const { fields: itemFields, remove: removeItem } = useFieldArray({
        control: form.control,
        name: `categories.${categoryIndex}.items`,
    });

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
                            onClick={onAddItem}
                            className="text-white hover:bg-white/10"
                            type="button"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Item
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDeleteCategory}
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
                                    onClick={onAddItem}
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
                                    item={item}
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
};

// Main Live Menu Editor Component
interface LiveMenuEditorProps {
    menu?: Menu | null;
    restaurants: Restaurant[];
    onSave: (menuData: MenuFormData) => void;
    onCancel: () => void;
    loading?: boolean;
    mode: 'create' | 'edit';
    form: UseFormReturn<MenuFormData>;
}

export default function LiveMenuEditor({
    menu,
    restaurants,
    onSave,
    onCancel,
    loading = false,
    mode,
    form,
}: LiveMenuEditorProps) {
    // Initialize state with empty defaults first
    const [menuData, setMenuData] = useState<any>({
        name: '',
        description: '',
        restaurantId: '',
        isActive: true,
        categories: [],
        theme: {
            primaryColor: '#1f2937',
            backgroundColor: '#f9fafb',
            accentColor: '#ef4444',
            fontFamily: 'Inter',
        },
    });

    // THIS IS THE KEY FIX: Sync state when menu prop changes
    useEffect(() => {
        if (menu && mode === 'edit') {
            setMenuData({
                name: menu.name || '',
                description: menu.description || '',
                restaurantId: menu.restaurantId || '',
                isActive: menu.isActive ?? true,
                categories: menu.categories || [],
                theme: menu.theme || {
                    primaryColor: '#1f2937',
                    backgroundColor: '#f9fafb',
                    accentColor: '#ef4444',
                    fontFamily: 'Inter',
                },
            });
        }
    }, [menu, mode]);

    const [activeTab, setActiveTab] = useState<'content' | 'theme'>('content');
    const [searchTerm, setSearchTerm] = useState('');

    const {
        fields: categoryFields,
        append: appendCategory,
        remove: removeCategory,
    } = useFieldArray({
        control: form.control,
        name: 'categories',
    });

    const watchedCategories = form.watch('categories');

    // Filter categories based on search
    const filteredCategories = useMemo(() => {
        if (!searchTerm) return watchedCategories;
        return watchedCategories.filter(
            (category: any) =>
                category.name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                category.description
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                category.items?.some(
                    (item: any) =>
                        item.name
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                        item.description
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase())
                )
        );
    }, [watchedCategories, searchTerm]);

    // Category management
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

    // Item management
    const addItemToCategory = useCallback(
        (categoryIndex: number) => {
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
                displayOrder: 1,
            };

            const currentItems =
                form.getValues(`categories.${categoryIndex}.items`) || [];
            form.setValue(`categories.${categoryIndex}.items`, [
                ...currentItems,
                newItem,
            ]);
        },
        [form]
    );

    // Save handler
    const handleSave = form.handleSubmit((data) => {
        onSave(data);
    });

    return (
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
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                            onClick={handleSave}
                            disabled={loading}
                            type="button"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? 'Saving...' : 'Save Menu'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <form onSubmit={handleSave} className="flex-1 flex overflow-hidden">
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
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('theme')}
                                className={`pb-3 border-b-2 text-sm font-semibold transition-all ${
                                    activeTab === 'theme'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Palette className="w-4 h-4 inline mr-2" />
                                Settings
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-auto">
                        {activeTab === 'content' && (
                            <div className="p-6">
                                {/* Search and Add Controls */}
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

                                {/* Categories */}
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
                                        categoryFields.map(
                                            (category: any, categoryIndex) => (
                                                <CategoryEditor
                                                    key={category.id}
                                                    category={category}
                                                    categoryIndex={
                                                        categoryIndex
                                                    }
                                                    form={form}
                                                    onDeleteCategory={() =>
                                                        removeCategory(
                                                            categoryIndex
                                                        )
                                                    }
                                                    onAddItem={() =>
                                                        addItemToCategory(
                                                            categoryIndex
                                                        )
                                                    }
                                                />
                                            )
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'theme' && (
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
                                                            required:
                                                                'Menu name is required',
                                                        }}
                                                        render={({
                                                            field,
                                                            fieldState,
                                                        }) => (
                                                            <div>
                                                                <FormInput
                                                                    {...field}
                                                                    placeholder="Menu name"
                                                                />
                                                                {fieldState.error && (
                                                                    <p className="text-red-500 text-sm mt-1">
                                                                        {
                                                                            fieldState
                                                                                .error
                                                                                .message
                                                                        }
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
                                                        Restaurant
                                                    </label>
                                                    <Controller
                                                        name="restaurantId"
                                                        control={form.control}
                                                        rules={{
                                                            required:
                                                                'Please select a restaurant',
                                                        }}
                                                        render={({
                                                            field,
                                                            fieldState,
                                                        }) => (
                                                            <div>
                                                                <Select
                                                                    value={
                                                                        field.value
                                                                    }
                                                                    onValueChange={
                                                                        field.onChange
                                                                    }
                                                                >
                                                                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                                                                        <SelectValue placeholder="Select restaurant" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="bg-white border-gray-300">
                                                                        {restaurants.map(
                                                                            (
                                                                                restaurant
                                                                            ) => (
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
                                                                        {
                                                                            fieldState
                                                                                .error
                                                                                .message
                                                                        }
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
                                                                    value={
                                                                        field.value
                                                                    }
                                                                    onChange={
                                                                        field.onChange
                                                                    }
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
                                                                    value={
                                                                        field.value
                                                                    }
                                                                    onChange={
                                                                        field.onChange
                                                                    }
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
                                                                    value={
                                                                        field.value
                                                                    }
                                                                    onChange={
                                                                        field.onChange
                                                                    }
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
                                                                Inter (Modern
                                                                Sans-serif)
                                                            </option>
                                                            <option value="Georgia">
                                                                Georgia (Classic
                                                                Serif)
                                                            </option>
                                                            <option value="Playfair Display">
                                                                Playfair Display
                                                                (Elegant Serif)
                                                            </option>
                                                            <option value="Roboto">
                                                                Roboto (Clean
                                                                Sans-serif)
                                                            </option>
                                                            <option value="Merriweather">
                                                                Merriweather
                                                                (Readable Serif)
                                                            </option>
                                                        </select>
                                                    )}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
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
            </form>
        </div>
    );
}
