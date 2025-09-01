import { MenuItem } from '@/types/menu';
import { Flame, Leaf, Wheat } from 'lucide-react';

interface DietaryTagsProps {
    item: MenuItem;
}

export function DietaryTags({ item }: DietaryTagsProps) {
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
} 