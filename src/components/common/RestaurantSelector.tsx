import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCallback } from 'react';

interface Restaurant {
  id: string;
  name: string;
}

interface RestaurantSelectorProps {
  restaurants: Restaurant[];
  selectedRestaurantId: string;
  onRestaurantChange: (restaurantId: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  label?: string;
  className?: string;
  // Advanced features
  hasMoreRestaurants?: boolean;
  onLoadMore?: () => void;
  loadMoreLoading?: boolean;
  showSearch?: boolean;
}

export function RestaurantSelector({
  restaurants,
  selectedRestaurantId,
  onRestaurantChange,
  isLoading = false,
  placeholder = 'Select restaurant',
  label = 'Restaurant',
  className = 'w-full md:w-80',
  hasMoreRestaurants = false,
  onLoadMore,
  loadMoreLoading = false,
  showSearch = false,
}: RestaurantSelectorProps) {
  const handleChange = useCallback(
    (val: string) => onRestaurantChange(val),
    [onRestaurantChange]
  );

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <Select value={selectedRestaurantId} onValueChange={handleChange}>
        <SelectTrigger className="w-full bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <SelectValue placeholder={isLoading ? 'Loading...' : placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white text-gray-900 border border-gray-200 max-h-60 overflow-y-auto">
          {/* Restaurants */}
          {restaurants.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.name}
            </SelectItem>
          ))}
          
          {/* Load more button for pagination */}
          {hasMoreRestaurants && onLoadMore && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLoadMore}
                disabled={loadMoreLoading}
                className="w-full"
              >
                {loadMoreLoading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
} 