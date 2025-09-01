import { MenuItem as MenuItemType, MenuTheme } from '@/types/menu';
import { Heart, Minus, Plus } from 'lucide-react';
import { DietaryTags } from './DietaryTags';

interface MenuItemProps {
    item: MenuItemType;
    theme: MenuTheme;
    favorites: Set<string>;
    cart: { [key: string]: number };
    onToggleFavorite: (itemId: string) => void;
    onAddToCart: (itemId: string) => void;
    onRemoveFromCart: (itemId: string) => void;
    isMobile?: boolean;
}

export function MenuItem({
    item,
    theme,
    favorites,
    cart,
    onToggleFavorite,
    onAddToCart,
    onRemoveFromCart,
    isMobile = false,
}: MenuItemProps) {
    const isInCart = cart[item.id] > 0;
    const itemQuantity = cart[item.id] || 0;

    return (
        <div
            className={`border-b border-gray-200 ${
                isMobile ? 'pb-4 last:border-b-0' : 'pb-6 last:border-b-0'
            }`}
        >
            <div className="flex justify-between items-start">
                <div className={`flex-1 ${isMobile ? 'pr-4' : 'pr-6'}`}>
                    <div className="flex items-start justify-between mb-2">
                        <h3
                            className={`font-semibold ${
                                isMobile ? 'text-lg' : 'text-xl'
                            }`}
                            style={{ color: theme.primaryColor }}
                        >
                            {item.name}
                        </h3>
                        <button
                            onClick={() => onToggleFavorite(item.id)}
                            className="p-1 ml-2"
                        >
                            <Heart
                                className={`w-4 h-4 ${
                                    favorites.has(item.id)
                                        ? 'fill-red-500 text-red-500'
                                        : 'text-gray-400'
                                }`}
                            />
                        </button>
                    </div>

                    {item.description && (
                        <p
                            className={`text-gray-600 leading-relaxed mb-2 ${
                                isMobile ? 'text-sm' : ''
                            }`}
                        >
                            {item.description}
                        </p>
                    )}

                    <DietaryTags item={item} />

                    <div className="flex items-center justify-between mt-4">
                        {isInCart ? (
                            <div className="flex items-center gap-3 bg-gray-50 rounded-full px-3 py-2">
                                <button
                                    onClick={() => onRemoveFromCart(item.id)}
                                    className={`rounded-full bg-white shadow-sm flex items-center justify-center ${
                                        isMobile ? 'w-6 h-6' : 'w-8 h-8'
                                    }`}
                                >
                                    <Minus
                                        className={`text-gray-600 ${
                                            isMobile ? 'w-3 h-3' : 'w-4 h-4'
                                        }`}
                                    />
                                </button>
                                <span
                                    className={`font-semibold text-center text-black ${
                                        isMobile ? 'text-sm min-w-4' : 'min-w-8'
                                    }`}
                                >
                                    {itemQuantity}
                                </span>
                                <button
                                    onClick={() => onAddToCart(item.id)}
                                    className={`rounded-full flex items-center justify-center text-white shadow-sm ${
                                        isMobile ? 'w-6 h-6' : 'w-8 h-8'
                                    }`}
                                    style={{
                                        backgroundColor: theme.primaryColor,
                                    }}
                                >
                                    <Plus
                                        className={
                                            isMobile ? 'w-3 h-3' : 'w-4 h-4'
                                        }
                                    />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => onAddToCart(item.id)}
                                className={`rounded-full flex items-center justify-center text-white shadow-sm ${
                                    isMobile ? 'w-8 h-8' : 'w-10 h-10'
                                }`}
                                style={{ backgroundColor: theme.primaryColor }}
                            >
                                <Plus
                                    className={isMobile ? 'w-4 h-4' : 'w-5 h-5'}
                                />
                            </button>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    <span
                        className={`font-bold ${
                            isMobile ? 'text-xl' : 'text-2xl'
                        }`}
                        style={{ color: theme.accentColor }}
                    >
                        ${item.price.toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    );
}
