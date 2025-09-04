import AppImage from '@/shared/components/ui/image';
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
        <div className="flex flex-wrap gap-2 mt-1">
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
            className="h-full overflow-auto"
            style={{
                backgroundColor: theme.backgroundColor,
                fontFamily: theme.fontFamily,
            }}
        >
            <div className="p-6 md:p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Menu Header */}
                    <div className="text-center mb-8">
                        <h1
                            className="text-5xl md:text-6xl font-serif mb-2 text-balance"
                            style={{ color: theme.primaryColor }}
                        >
                            {menuData.name || 'Menu Name'}
                        </h1>
                        {menuData.description && (
                            <p
                                className="text-lg font-medium tracking-wider"
                                style={{ color: theme.primaryColor }}
                            >
                                {menuData.description}
                            </p>
                        )}
                    </div>

                    {/* Categories - 2 Column Layout */}
                    {menuData.categories && menuData.categories.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2 ">
                            {menuData.categories
                                .filter((cat) => cat.isActive !== false)
                                .map((category) => {
                                    const items = (category.items || [])
                                        .filter(
                                            (item) => item.isAvailable !== false
                                        )
                                        .sort(
                                            (a, b) =>
                                                (a.displayOrder || 0) -
                                                (b.displayOrder || 0)
                                        );
                                    if (items.length === 0) return null;
                                    return (
                                        <div
                                            key={category.id}
                                            className="space-y-6 md:space-y-8"
                                        >
                                            <div>
                                                <h2
                                                    className="text-lg md:text-xl font-bold tracking-wider"
                                                    style={{
                                                        color: theme.primaryColor,
                                                    }}
                                                >
                                                    {(
                                                        category.name ||
                                                        'Category Name'
                                                    ).toUpperCase()}
                                                </h2>
                                                {category.description && (
                                                    <p className="text-sm text-gray-600">
                                                        {category.description}
                                                    </p>
                                                )}
                                                <hr
                                                    className="md:my-2 border-t"
                                                    style={{
                                                        borderColor: `${theme.primaryColor}40`,
                                                    }}
                                                />
                                                <div className="space-y-3 md:space-y-4">
                                                    {items.map(
                                                        (
                                                            item,
                                                            index: number
                                                        ) => (
                                                            <div
                                                                key={
                                                                    item.id ||
                                                                    `item-${index}`
                                                                }
                                                                className="flex gap-3 items-start"
                                                            >
                                                                <div className="w-12 h-12 md:w-15 md:h-15 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                                    {item.imageUrl ? (
                                                                        <AppImage
                                                                            src={
                                                                                item.imageUrl!
                                                                            }
                                                                            alt={
                                                                                item.name
                                                                            }
                                                                            fill
                                                                            className="object-cover w-full h-full"
                                                                        />
                                                                    ) : (
                                                                        '🍽️'
                                                                    )}
                                                                </div>

                                                                <div className="flex justify-between items-start gap-2 md:gap-3 flex-1">
                                                                    <div className="flex-1">
                                                                        <h3
                                                                            className="font-semibold text-gray-900 text-sm md:text-base"
                                                                            style={{
                                                                                color: theme.primaryColor,
                                                                            }}
                                                                        >
                                                                            {item.name ||
                                                                                'Item Name'}
                                                                        </h3>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            <DietaryTags
                                                                                item={
                                                                                    item
                                                                                }
                                                                            />
                                                                        </div>
                                                                        {item.description && (
                                                                            <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                                                                                {
                                                                                    item.description
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-2 min-w-fit text-right">
                                                                        <span
                                                                            className="font-semibold text-gray-900 text-sm md:text-base"
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
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <ChefHat className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                No menu items yet
                            </h3>
                            <p className="text-gray-500">
                                Start adding categories and items to see your
                                menu preview
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
