import { MenuTheme } from '@/types/menu';
import { Globe } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Language {
    code: string;
    name: string;
    flag: string;
}

interface LanguageSelectorProps {
    languages: Language[];
    selectedLanguage: Language;
    onSelectLanguage: (language: Language) => void;
    isMobile?: boolean;
    theme?: MenuTheme;
}

export function LanguageSelector({
    languages,
    selectedLanguage,
    onSelectLanguage,
    isMobile = false,
    theme
}: LanguageSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    !isMobile ? 'px-3 py-2 border' : ''
                }`}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                style={{
                    borderColor: theme?.primaryColor ? theme.primaryColor + '30' : undefined,
                    '--tw-ring-color': theme?.primaryColor
                } as React.CSSProperties}
            >
                <Globe className="w-4 h-4" style={{ color: theme?.primaryColor || '#000' }} />
                {isMobile && (
                    <span className="text-sm">{selectedLanguage.flag}</span>
                )}
                {!isMobile && (
                    <>
                        <span className="text-sm">{selectedLanguage.flag}</span>
                        <span className="text-sm" style={{ color: theme?.primaryColor || '#000' }}>{selectedLanguage.name}</span>
                    </>
                )}
            </button>
            
            {isOpen && (
                <div 
                    className={`absolute right-0 mt-2 bg-white rounded-xl shadow-lg border z-50 py-2 ${
                        isMobile ? 'w-40' : 'w-48'
                    }`}
                    style={{
                        borderColor: theme?.primaryColor ? theme.primaryColor + '20' : undefined,
                        boxShadow: theme?.primaryColor ? `0 10px 25px -3px ${theme.primaryColor}20` : undefined
                    }}
                >
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectLanguage(lang);
                                setIsOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left flex items-center gap-2 text-sm transition-colors hover:bg-gray-50"
                            style={{
                                color: theme?.primaryColor || '#000',
                                '--tw-ring-color': theme?.primaryColor
                            } as React.CSSProperties}
                        >
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
} 