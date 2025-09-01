import { MenuTheme } from '@/types/menu';
import { Filter, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchAndFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    showFilters: boolean;
    onToggleFilters: () => void;
    dietaryFilter: string;
    onDietaryFilterChange: (value: string) => void;
    theme: MenuTheme;
    isMobile?: boolean;
}

export function SearchAndFilters({
    searchTerm,
    onSearchChange,
    showFilters,
    onToggleFilters,
    dietaryFilter,
    onDietaryFilterChange,
    theme,
    isMobile = false,
}: SearchAndFiltersProps) {
    const { t } = useTranslation('menu-preview');

    const filterOptions = [
        { value: 'all', label: t('filters.all') },
        { value: 'vegetarian', label: t('filters.vegetarian') },
        { value: 'vegan', label: t('filters.vegan') },
        { value: 'gluten-free', label: t('filters.gluten-free') },
        { value: 'spicy', label: t('filters.spicy') },
    ];

    return (
        <div className={`bg-white/50 backdrop-blur-md border-b border-white/20 relative ${isMobile ? 'px-4 py-3' : 'p-6'}`}>
            <div className="relative">
                <Search 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                    style={{ color: theme.primaryColor }}
                />
                <input
                    type="text"
                    placeholder={t('filter_input_placeholder')}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-white/backdrop-blur-sm border border-black/20 rounded-xl focus:ring-2 focus:bg-white/80 focus:border-white/50 transition-all text-sm text-gray-900 placeholder-gray-600"
                    style={
                        {
                            '--tw-ring-color': theme.primaryColor,
                        } as React.CSSProperties
                    }
                />
                <button
                    onClick={onToggleFilters}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/40 transition-colors"
                >
                    <Filter 
                        className="w-4 h-4" 
                        style={{ color: theme.primaryColor }}
                    />
                </button>
            </div>

            {showFilters && (
                <div
                    className={`flex flex-wrap gap-2 ${
                        isMobile ? 'mt-3' : 'mt-3'
                    }`}
                >
                    {filterOptions.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => onDietaryFilterChange(filter.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors backdrop-blur-sm ${
                                dietaryFilter === filter.value
                                    ? 'text-white shadow-lg'
                                    : 'bg-white/60 text-gray-700 hover:bg-white/80 border border-white/30'
                            }`}
                            style={
                                dietaryFilter === filter.value
                                    ? { 
                                        backgroundColor: theme.primaryColor,
                                        boxShadow: `0 4px 14px 0 ${theme.primaryColor}40`
                                    }
                                    : {}
                            }
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
