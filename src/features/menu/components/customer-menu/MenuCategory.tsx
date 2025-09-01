import type { MenuCategory, MenuTheme } from '@/types/menu';
import { CategoryHeader } from './CategoryHeader';
import { MenuItem } from './MenuItem';

interface MenuCategoryProps {
    category: MenuCategory;
    items: MenuCategory['items'];
    theme: MenuTheme;
    favorites: Set<string>;
    cart: { [key: string]: number };
    isCollapsed: boolean;
    onToggleCategory: () => void;
    onToggleFavorite: (itemId: string) => void;
    onAddToCart: (itemId: string) => void;
    onRemoveFromCart: (itemId: string) => void;
    isMobile?: boolean;
}

export function MenuCategory({
    category,
    items,
    theme,
    favorites,
    cart,
    isCollapsed,
    onToggleCategory,
    onToggleFavorite,
    onAddToCart,
    onRemoveFromCart,
    isMobile = false,
}: MenuCategoryProps) {
    if (items.length === 0) return null;

    return (
        <div className={isMobile ? 'mb-8' : 'mb-10'}>
            <div className={isMobile ? 'mb-4' : 'mb-6'}>
                <CategoryHeader
                    category={category}
                    theme={theme}
                    isCollapsed={isCollapsed}
                    onToggle={onToggleCategory}
                    isMobile={isMobile}
                />
                {category.description && (
                    <p
                        className={`text-gray-600 leading-relaxed ${
                            isMobile ? 'text-sm' : 'text-lg'
                        }`}
                    >
                        {category.description}
                    </p>
                )}
            </div>

            {!isCollapsed && (
                <div className={isMobile ? 'space-y-4' : 'space-y-6'}>
                    {items.map((item) => (
                        <MenuItem
                            key={item.id}
                            item={item}
                            theme={theme}
                            favorites={favorites}
                            cart={cart}
                            onToggleFavorite={onToggleFavorite}
                            onAddToCart={onAddToCart}
                            onRemoveFromCart={onRemoveFromCart}
                            isMobile={isMobile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
