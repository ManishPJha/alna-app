import { MenuFormData, MenuItem } from '@/types/menu';
import { ChefHat, Flame, Leaf, Wheat } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface MenuPreviewProps {
    form: UseFormReturn<MenuFormData>;
}

const DietaryTags = ({ item }: { item: MenuItem }) => {
    const tags = [];

    if (item.isVegetarian) {
        tags.push({
            label: 'Vegetarian',
            className: 'bg-green-100 text-green-800 border border-green-200',
            icon: <Leaf className="w-3 h-3" />,
        });
    }

    if (item.isVegan) {
        tags.push({
            label: 'Vegan',
            className: 'bg-blue-100 text-blue-800 border border-blue-200',
            icon: <Leaf className="w-3 h-3" />,
        });
    }

    if (item.isGlutenFree) {
        tags.push({
            label: 'Gluten-Free',
            className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
            icon: <Wheat className="w-3 h-3" />,
        });
    }

    if (item.isSpicy) {
        tags.push({
            label: 'Spicy',
            className: 'bg-red-100 text-red-800 border border-red-200',
            icon: <Flame className="w-3 h-3" />,
        });
    }

    if (tags.length === 0) return null;

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

export function MenuPreview({ form }: MenuPreviewProps) {
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
                {menuData.categories && menuData.categories.length > 0 ? (
                    menuData.categories
                        .filter((cat: any) => cat.isActive !== false)
                        .map((category: any) => (
                            <div key={category.id} className="mb-10">
                                <div className="mb-6">
                                    <h2
                                        className="text-3xl font-bold mb-3"
                                        style={{ color: theme.primaryColor }}
                                    >
                                        {category.name || 'Category Name'}
                                    </h2>
                                    {category.description && (
                                        <p className="text-gray-600 text-lg leading-relaxed">
                                            {category.description}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {category.items &&
                                    category.items.length > 0 ? (
                                        category.items
                                            .filter(
                                                (item: any) =>
                                                    item.isAvailable !== false
                                            )
                                            .sort(
                                                (a: any, b: any) =>
                                                    (a.displayOrder || 0) -
                                                    (b.displayOrder || 0)
                                            )
                                            .map((item: any) => (
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
                                                                {item.name ||
                                                                    'Item Name'}
                                                            </h3>
                                                            {item.description && (
                                                                <p className="text-gray-600 leading-relaxed mb-2">
                                                                    {
                                                                        item.description
                                                                    }
                                                                </p>
                                                            )}
                                                            <DietaryTags
                                                                item={item}
                                                            />
                                                        </div>
                                                        <div className="text-right">
                                                            <span
                                                                className="text-2xl font-bold"
                                                                style={{
                                                                    color: theme.accentColor,
                                                                }}
                                                            >
                                                                $
                                                                {typeof item.price ===
                                                                'number'
                                                                    ? item.price.toFixed(
                                                                          2
                                                                      )
                                                                    : '0.00'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>No items in this category yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                ) : (
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
}
