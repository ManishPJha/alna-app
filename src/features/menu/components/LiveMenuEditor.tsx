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
import React, { useCallback, useMemo, useState } from 'react';

// Input Components matching your project style
const Input = ({
    value,
    onChange,
    placeholder = '',
    type = 'text',
    className = '',
    ...props
}: {
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
    className?: string;
    [key: string]: any;
}) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border border-gray-300 text-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${className}`}
        {...props}
    />
);

const Textarea = ({
    value,
    onChange,
    placeholder = '',
    rows = 3,
    className = '',
    ...props
}: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
    [key: string]: any;
}) => (
    <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full border border-gray-300 text-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none ${className}`}
        {...props}
    />
);

const Checkbox = ({
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
const MenuPreview = ({ menu }: { menu: any }) => {
    const theme = menu.theme || {
        primaryColor: '#1f2937',
        backgroundColor: '#f9fafb',
        accentColor: '#ef4444',
        fontFamily: 'Inter',
    };

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
                        {menu.name || 'Menu Name'}
                    </h1>
                    {menu.description && (
                        <p className="text-lg text-gray-600 leading-relaxed">
                            {menu.description}
                        </p>
                    )}
                </div>

                {/* Categories */}
                {menu.categories
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

                {(!menu.categories ||
                    menu.categories.filter((cat: any) => cat.isActive)
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
    onUpdate,
    onDelete,
}: {
    item: any;
    onUpdate: (updates: Partial<any>) => void;
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
                            <Input
                                value={item.name || ''}
                                onChange={(e) =>
                                    onUpdate({ name: e.target.value })
                                }
                                placeholder="Enter delicious item name..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Price ($)
                            </label>
                            <Input
                                type="number"
                                value={item.price || 0}
                                onChange={(e) =>
                                    onUpdate({
                                        price: parseFloat(e.target.value) || 0,
                                    })
                                }
                                placeholder="0.00"
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                        </label>
                        <Textarea
                            value={item.description || ''}
                            onChange={(e) =>
                                onUpdate({ description: e.target.value })
                            }
                            placeholder="Describe this amazing dish..."
                            rows={3}
                        />
                    </div>

                    {/* Dietary Options */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Dietary Options
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Checkbox
                                id={`veg-${item.id}`}
                                checked={item.isVegetarian || false}
                                onChange={(checked) =>
                                    onUpdate({ isVegetarian: checked })
                                }
                                label="Vegetarian"
                            />
                            <Checkbox
                                id={`vegan-${item.id}`}
                                checked={item.isVegan || false}
                                onChange={(checked) =>
                                    onUpdate({ isVegan: checked })
                                }
                                label="Vegan"
                            />
                            <Checkbox
                                id={`gf-${item.id}`}
                                checked={item.isGlutenFree || false}
                                onChange={(checked) =>
                                    onUpdate({ isGlutenFree: checked })
                                }
                                label="Gluten-Free"
                            />
                            <Checkbox
                                id={`spicy-${item.id}`}
                                checked={item.isSpicy || false}
                                onChange={(checked) =>
                                    onUpdate({ isSpicy: checked })
                                }
                                label="Spicy"
                            />
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <Checkbox
                            id={`available-${item.id}`}
                            checked={item.isAvailable ?? true}
                            onChange={(checked) =>
                                onUpdate({ isAvailable: checked })
                            }
                            label="Available for ordering"
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
    onUpdate,
    onDeleteCategory,
    onAddItem,
    onUpdateItem,
    onDeleteItem,
}: {
    category: any;
    onUpdate: (updates: Partial<any>) => void;
    onDeleteCategory: () => void;
    onAddItem: () => void;
    onUpdateItem: (itemId: string, updates: Partial<any>) => void;
    onDeleteItem: (itemId: string) => void;
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <Card className="mb-6 hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <ChefHat className="w-5 h-5" />
                        </button>
                        <div className="flex-1">
                            <Input
                                value={category.name || ''}
                                onChange={(e) =>
                                    onUpdate({ name: e.target.value })
                                }
                                className="bg-white/10 border-white/20 text-white placeholder-white/70 font-semibold text-lg"
                                placeholder="Category Name"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onAddItem}
                            className="text-white hover:bg-white/10"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Item
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDeleteCategory}
                            className="text-white hover:bg-red-500/20"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="mt-3">
                    <Textarea
                        value={category.description || ''}
                        onChange={(e) =>
                            onUpdate({ description: e.target.value })
                        }
                        placeholder="Category description (optional)"
                        rows={2}
                        className="bg-white/10 border-white/20 text-white placeholder-white/70"
                    />
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        {!category.items || category.items.length === 0 ? (
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
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add First Item
                                </Button>
                            </div>
                        ) : (
                            category.items
                                ?.sort(
                                    (a: any, b: any) =>
                                        (a.displayOrder || 0) -
                                        (b.displayOrder || 0)
                                )
                                ?.map((item: any) => (
                                    <ItemEditor
                                        key={item.id}
                                        item={item}
                                        onUpdate={(updates) =>
                                            onUpdateItem(item.id, updates)
                                        }
                                        onDelete={() => onDeleteItem(item.id)}
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
    onSave: (menuData: any) => void;
    onCancel: () => void;
    loading?: boolean;
    mode: 'create' | 'edit';
}

export default function LiveMenuEditor({
    menu,
    restaurants,
    onSave,
    onCancel,
    loading = false,
    mode,
}: LiveMenuEditorProps) {
    // Initialize state from existing menu or defaults
    const [menuData, setMenuData] = useState<any>(() => {
        if (menu && mode === 'edit') {
            return {
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
            };
        }
        return {
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
        };
    });

    const [activeTab, setActiveTab] = useState<'content' | 'theme'>('content');
    const [searchTerm, setSearchTerm] = useState('');

    // Filter categories based on search
    const filteredCategories = useMemo(() => {
        if (!searchTerm) return menuData.categories;
        return menuData.categories.filter(
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
    }, [menuData.categories, searchTerm]);

    // Category management
    const addCategory = useCallback(() => {
        const newCategory = {
            id: `temp-cat-${Date.now()}`,
            name: 'New Category',
            description: '',
            displayOrder: menuData.categories.length + 1,
            isActive: true,
            items: [],
        };
        setMenuData((prev: any) => ({
            ...prev,
            categories: [...prev.categories, newCategory],
        }));
    }, [menuData.categories.length]);

    const updateCategory = useCallback(
        (categoryId: string, updates: Partial<any>) => {
            setMenuData((prev: any) => ({
                ...prev,
                categories: prev.categories.map((cat: any) =>
                    cat.id === categoryId ? { ...cat, ...updates } : cat
                ),
            }));
        },
        []
    );

    const deleteCategory = useCallback((categoryId: string) => {
        setMenuData((prev: any) => ({
            ...prev,
            categories: prev.categories.filter(
                (cat: any) => cat.id !== categoryId
            ),
        }));
    }, []);

    // Item management
    const addItem = useCallback((categoryId: string) => {
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
            categoryId,
        };

        setMenuData((prev: any) => ({
            ...prev,
            categories: prev.categories.map((cat: any) =>
                cat.id === categoryId
                    ? { ...cat, items: [...(cat.items || []), newItem] }
                    : cat
            ),
        }));
    }, []);

    const updateItem = useCallback(
        (categoryId: string, itemId: string, updates: Partial<any>) => {
            setMenuData((prev: any) => ({
                ...prev,
                categories: prev.categories.map((cat: any) =>
                    cat.id === categoryId
                        ? {
                              ...cat,
                              items: (cat.items || []).map((item: any) =>
                                  item.id === itemId
                                      ? { ...item, ...updates }
                                      : item
                              ),
                          }
                        : cat
                ),
            }));
        },
        []
    );

    const deleteItem = useCallback((categoryId: string, itemId: string) => {
        setMenuData((prev: any) => ({
            ...prev,
            categories: prev.categories.map((cat: any) =>
                cat.id === categoryId
                    ? {
                          ...cat,
                          items: (cat.items || []).filter(
                              (item: any) => item.id !== itemId
                          ),
                      }
                    : cat
            ),
        }));
    }, []);

    // Theme management
    const updateTheme = useCallback((updates: Partial<any>) => {
        setMenuData((prev: any) => ({
            ...prev,
            theme: { ...prev.theme, ...updates },
        }));
    }, []);

    // Save handler
    const handleSave = () => {
        onSave(menuData);
    };

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
                        <Button variant="outline" size="sm" onClick={onCancel}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? 'Saving...' : 'Save Menu'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Editor Panel */}
                <div className="w-1/2 border-r border-gray-200 flex flex-col bg-white">
                    {/* Tabs */}
                    <div className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
                        <div className="flex space-x-8">
                            <button
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
                                        <Input
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            placeholder="Search categories and items..."
                                            className="pl-10"
                                        />
                                    </div>
                                    <Button
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
                                                    onClick={addCategory}
                                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Add First Category
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        filteredCategories.map(
                                            (category: any) => (
                                                <CategoryEditor
                                                    key={category.id}
                                                    category={category}
                                                    onUpdate={(updates) =>
                                                        updateCategory(
                                                            category.id,
                                                            updates
                                                        )
                                                    }
                                                    onDeleteCategory={() =>
                                                        deleteCategory(
                                                            category.id
                                                        )
                                                    }
                                                    onAddItem={() =>
                                                        addItem(category.id)
                                                    }
                                                    onUpdateItem={(
                                                        itemId,
                                                        updates
                                                    ) =>
                                                        updateItem(
                                                            category.id,
                                                            itemId,
                                                            updates
                                                        )
                                                    }
                                                    onDeleteItem={(itemId) =>
                                                        deleteItem(
                                                            category.id,
                                                            itemId
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
                                                    <Input
                                                        value={menuData.name}
                                                        onChange={(e) =>
                                                            setMenuData(
                                                                (
                                                                    prev: any
                                                                ) => ({
                                                                    ...prev,
                                                                    name: e
                                                                        .target
                                                                        .value,
                                                                })
                                                            )
                                                        }
                                                        placeholder="Menu name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Description
                                                    </label>
                                                    <Textarea
                                                        value={
                                                            menuData.description ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            setMenuData(
                                                                (
                                                                    prev: any
                                                                ) => ({
                                                                    ...prev,
                                                                    description:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        placeholder="Brief description of your menu"
                                                        rows={3}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Restaurant
                                                    </label>
                                                    <Select
                                                        value={
                                                            menuData.restaurantId
                                                        }
                                                        onValueChange={(
                                                            value
                                                        ) =>
                                                            setMenuData(
                                                                (
                                                                    prev: any
                                                                ) => ({
                                                                    ...prev,
                                                                    restaurantId:
                                                                        value,
                                                                })
                                                            )
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
                                                    <div className="flex items-center space-x-3">
                                                        <input
                                                            type="color"
                                                            value={
                                                                menuData.theme
                                                                    .primaryColor
                                                            }
                                                            onChange={(e) =>
                                                                updateTheme({
                                                                    primaryColor:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                                                        />
                                                        <Input
                                                            value={
                                                                menuData.theme
                                                                    .primaryColor
                                                            }
                                                            onChange={(e) =>
                                                                updateTheme({
                                                                    primaryColor:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            placeholder="#000000"
                                                            className="flex-1"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                        Background Color
                                                    </label>
                                                    <div className="flex items-center space-x-3">
                                                        <input
                                                            type="color"
                                                            value={
                                                                menuData.theme
                                                                    .backgroundColor
                                                            }
                                                            onChange={(e) =>
                                                                updateTheme({
                                                                    backgroundColor:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                                                        />
                                                        <Input
                                                            value={
                                                                menuData.theme
                                                                    .backgroundColor
                                                            }
                                                            onChange={(e) =>
                                                                updateTheme({
                                                                    backgroundColor:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            placeholder="#ffffff"
                                                            className="flex-1"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                        Accent Color
                                                    </label>
                                                    <div className="flex items-center space-x-3">
                                                        <input
                                                            type="color"
                                                            value={
                                                                menuData.theme
                                                                    .accentColor
                                                            }
                                                            onChange={(e) =>
                                                                updateTheme({
                                                                    accentColor:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                                                        />
                                                        <Input
                                                            value={
                                                                menuData.theme
                                                                    .accentColor
                                                            }
                                                            onChange={(e) =>
                                                                updateTheme({
                                                                    accentColor:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            placeholder="#ff0000"
                                                            className="flex-1"
                                                        />
                                                    </div>
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
                                                <select
                                                    value={
                                                        menuData.theme
                                                            .fontFamily
                                                    }
                                                    onChange={(e) =>
                                                        updateTheme({
                                                            fontFamily:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-full border border-gray-300 text-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                >
                                                    <option value="Inter">
                                                        Inter (Modern
                                                        Sans-serif)
                                                    </option>
                                                    <option value="Georgia">
                                                        Georgia (Classic Serif)
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
                                                        Merriweather (Readable
                                                        Serif)
                                                    </option>
                                                </select>
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
                        <MenuPreview menu={menuData} />
                    </div>
                </div>
            </div>
        </div>
    );
}
