import type { MenuCategory, MenuTheme } from '@/types/menu';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CategoryHeaderProps {
    category: MenuCategory;
    theme: MenuTheme;
    isCollapsed: boolean;
    onToggle: () => void;
    isMobile?: boolean;
}

export function CategoryHeader({
    category,
    theme,
    isCollapsed,
    onToggle,
    isMobile = false,
}: CategoryHeaderProps) {
    return (
        <button
            onClick={onToggle}
            className={`flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity ${
                isMobile ? 'gap-2' : 'gap-3'
            }`}
        >
            <div className="flex-1">
                <h2
                    className={`font-bold mb-2 ${
                        isMobile ? 'text-2xl' : 'text-3xl'
                    }`}
                    style={{ color: theme.primaryColor }}
                >
                    {category.name || 'Category Name'}
                </h2>
                <div
                    className="h-0.5 w-full"
                    style={{ backgroundColor: theme.primaryColor }}
                ></div>
            </div>
            {isCollapsed ? (
                <ChevronRight
                    className={isMobile ? 'w-5 h-5' : 'w-6 h-6'}
                    style={{ color: theme.primaryColor }}
                />
            ) : (
                <ChevronDown
                    className={isMobile ? 'w-5 h-5' : 'w-6 h-6'}
                    style={{ color: theme.primaryColor }}
                />
            )}
        </button>
    );
}
