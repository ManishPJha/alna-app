'use client';

import { ChefHat, Globe, Leaf } from 'lucide-react';

interface QuickActionButtonProps {
    type: 'translate' | 'vegetarian' | 'recommendations';
    onClick: () => void;
    disabled?: boolean;
    languageFlag?: string;
}

export function QuickActionButton({ 
    type, 
    onClick, 
    disabled = false, 
    languageFlag 
}: QuickActionButtonProps) {
    const getButtonConfig = () => {
        switch (type) {
            case 'translate':
                return {
                    icon: <Globe className="w-3 h-3" />,
                    label: 'Translate to',
                    bgColor: 'bg-purple-50',
                    textColor: 'text-purple-700',
                    hoverColor: 'hover:bg-purple-100'
                };
            case 'vegetarian':
                return {
                    icon: <Leaf className="w-3 h-3" />,
                    label: 'Vegetarian',
                    bgColor: 'bg-green-50',
                    textColor: 'text-green-700',
                    hoverColor: 'hover:bg-green-100'
                };
            case 'recommendations':
                return {
                    icon: <ChefHat className="w-3 h-3" />,
                    label: 'Recommendations',
                    bgColor: 'bg-blue-50',
                    textColor: 'text-blue-700',
                    hoverColor: 'hover:bg-blue-100'
                };
        }
    };

    const config = getButtonConfig();

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-1 px-2 py-1 text-xs ${config.bgColor} ${config.textColor} rounded-lg ${config.hoverColor} transition-colors disabled:opacity-50`}
        >
            {config.icon}
            <span className="hidden sm:inline">{config.label}</span>
            {type === 'translate' && languageFlag && (
                <span>{languageFlag}</span>
            )}
        </button>
    );
} 