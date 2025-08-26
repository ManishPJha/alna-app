/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { askAiFromDb } from '@/ai/flows/ask-ai-db-flow';
import { translateMenu } from '@/ai/flows/translate-menu-flow';
import { MenuFormData, MenuItem } from '@/types/menu';
import {
    ChefHat,
    Filter,
    Flame,
    Globe,
    Heart,
    Leaf,
    Minus,
    Plus,
    Search,
    Wheat,
    X
} from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { AIChatButton, ChatInterface } from './chat';


interface ChatMessage {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

interface CustomerMenuPreviewProps {
    form: UseFormReturn<MenuFormData>;
}

interface Category {
    id: string;
    name: string;
    description: string;
    items: MenuItem[];
    isActive: boolean;
}

// Use supported languages from AI config
// const languages = supportedLanguages;

const DietaryTags = ({ item }: { item: MenuItem }) => {
    const tags = [];

    if (item.isVegetarian) {
        tags.push({
            label: 'Vegetariano',
            className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
            icon: <Leaf className="w-3 h-3" />,
        });
    }

    if (item.isVegan) {
        tags.push({
            label: 'Vegano',
            className: 'bg-green-50 text-green-700 border border-green-200',
            icon: <Leaf className="w-3 h-3" />,
        });
    }

    if (item.isGlutenFree) {
        tags.push({
            label: 'Sin Gluten',
            className: 'bg-amber-50 text-amber-700 border border-amber-200',
            icon: <Wheat className="w-3 h-3" />,
        });
    }

    if (item.isSpicy) {
        tags.push({
            label: 'Picante',
            className: 'bg-red-50 text-red-700 border border-red-200',
            icon: <Flame className="w-3 h-3" />,
        });
    }

    if (tags.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag, index) => (
                <span
                    key={index}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${tag.className}`}
                >
                    {tag.icon}
                    <span className="ml-1">{tag.label}</span>
                </span>
            ))}
        </div>
    );
};

export function CustomerMenuPreview({ form }: CustomerMenuPreviewProps) {
    const menuData = form.watch();
    const theme = menuData.theme;
    const params = useParams();
    
    const getRestaurantId = () => {
        if (params?.id) {
            const id = Array.isArray(params.id) ? params.id[0] : params.id;
            const match = id.match(/menu-(.+)/);
            return match ? match[1] : id;
        }
        return '1';
    };
    
    // Default theme fallback
    const defaultTheme = {
        primaryColor: '#1f2937',
        backgroundColor: '#ffffff',
        accentColor: '#ef4444',
        fontFamily: 'Inter'
    };
    
    const displayTheme = theme || defaultTheme;
    
    // State management
    // const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            text: 'Hello! I\'m your AI menu assistant. I can help you find dishes, explain ingredients, suggest pairings, or answer any questions about our menu!',
            isUser: false,
            timestamp: new Date()
        }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [dietaryFilter, setDietaryFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [cart, setCart] = useState<{[key: string]: number}>({});
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);
    
    // Language support
    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
        { code: 'it', name: 'Italiano', flag: '🇮🇹' },
        { code: 'pt', name: 'Português', flag: '🇵🇹' },
        { code: 'ja', name: '日本語', flag: '🇯🇵' },
        { code: 'zh', name: '中文', flag: '🇨🇳' },
        { code: 'ko', name: '한국어', flag: '🇰🇷' }
    ];
    const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
    const [translatedMenuData, setTranslatedMenuData] = useState<any>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    // Auto-translate menu when language changes
    useEffect(() => {
        if (selectedLanguage.code !== 'en') {
            translateMenuContent();
        } else {
            setTranslatedMenuData(null); // Reset to original English
        }
    }, [selectedLanguage]);

    const translateMenuContent = async () => {
        if (selectedLanguage.code === 'en') return;
        
        setIsTranslating(true);
        try {
            const menuDataForTranslation = prepareMenuForTranslation();
            const translated = await translateMenu({
                menu: JSON.stringify(menuDataForTranslation),
                language: selectedLanguage.name
            });
            setTranslatedMenuData(translated);
        } catch (error) {
            console.error('Menu translation error:', error);
            setTranslatedMenuData(null);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleQuickAction = (type: 'translate' | 'vegetarian' | 'recommendations') => {
        let message = '';
        
        switch (type) {
            case 'translate':
                message = `Translate menu to ${selectedLanguage.name}`;
                break;
            case 'vegetarian':
                message = "What are your vegetarian options?";
                break;
            case 'recommendations':
                message = "Can you recommend something?";
                break;
        }
        
        setChatInput(message);
        // Use setTimeout to ensure state is updated before sending
        setTimeout(() => {
            const userMessage: ChatMessage = {
                id: Date.now().toString(),
                text: message,
                isUser: true,
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, userMessage]);
            setChatInput('');
            
            if (type === 'translate') {
                handleTranslationRequest(selectedLanguage.name);
            } else {
                handleGeneralQuestion(message);
            }
        }, 0);
    };
    

    // Filter functions
    const filteredCategories = menuData.categories?.filter((cat: any) => {
        if (!cat.isActive) return false;
        
        const hasMatchingItems = cat.items?.some((item: any) => {
            if (!item.isAvailable) return false;
            
            const matchesSearch = !searchTerm || 
                item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesDietary = dietaryFilter === 'all' ||
                (dietaryFilter === 'vegetarian' && item.isVegetarian) ||
                (dietaryFilter === 'vegan' && item.isVegan) ||
                (dietaryFilter === 'gluten-free' && item.isGlutenFree) ||
                (dietaryFilter === 'spicy' && item.isSpicy);
            
            return matchesSearch && matchesDietary;
        });
        
        return hasMatchingItems;
    });

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isChatLoading) return;
        
        setIsChatLoading(true);
        
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            text: chatInput,
            isUser: true,
            timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, userMessage]);
        const currentInput = chatInput;
        setChatInput('');
        
        // Add loading message
        const loadingMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: 'Thinking...',
            isUser: false,
            timestamp: new Date()
        };
        setChatMessages(prev => [...prev, loadingMessage]);
        
        try {
            let response: string;
            
            // Check if it's a translation request or if user wants to translate to selected language
            if (currentInput.toLowerCase().includes('translate') || 
                currentInput.toLowerCase().includes('traducir') ||
                currentInput.toLowerCase().includes('translate menu') ||
                currentInput.toLowerCase().includes('translate to')) {
                
                let targetLanguage = selectedLanguage.name;
                
                // If user specified a language in the request, use that instead
                const requestedLanguage = extractLanguageFromRequest(currentInput);
                if (requestedLanguage) {
                    targetLanguage = requestedLanguage;
                }
                
                const menuDataForTranslation = prepareMenuForTranslation();
                const translatedMenu = await translateMenu({
                    menu: JSON.stringify(menuDataForTranslation),
                    language: targetLanguage
                });
                response = `Here's your menu translated to ${targetLanguage}:\n\n${formatTranslatedMenu(translatedMenu)}`;
            } else {
                // Use the AI database flow for general questions
                const result = await askAiFromDb({
                    restaurantId: getRestaurantId(),
                    question: currentInput,
                    includeFaq: true
                });
                response = result.answer;
            }
            
            // Replace loading message with actual response
            setChatMessages(prev => prev.map(msg => 
                msg.id === loadingMessage.id 
                    ? { ...msg, text: response }
                    : msg
            ));
        } catch (error) {
            console.error('AI response error:', error);
            // Replace loading message with error response
            setChatMessages(prev => prev.map(msg => 
                msg.id === loadingMessage.id 
                    ? { ...msg, text: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment." }
                    : msg
            ));
        } finally {
            setIsChatLoading(false);
        }
    };

    const extractLanguageFromRequest = (input: string): string | null => {
        const lowerInput = input.toLowerCase();
        const languageMap: { [key: string]: string } = {
            'spanish': 'Spanish',
            'español': 'Spanish',
            'espanol': 'Spanish',
            'french': 'French',
            'français': 'French',
            'francais': 'French',
            'german': 'German',
            'deutsch': 'German',
            'italian': 'Italian',
            'italiano': 'Italian',
            'portuguese': 'Portuguese',
            'português': 'Portuguese',
            'portugues': 'Portuguese',
            'japanese': 'Japanese',
            '日本語': 'Japanese',
            'chinese': 'Chinese',
            '中文': 'Chinese',
            'korean': 'Korean',
            '한국어': 'Korean'
        };
        
        for (const [key, language] of Object.entries(languageMap)) {
            if (lowerInput.includes(key)) {
                return language;
            }
        }
        return null;
    };

    const prepareMenuForTranslation = () => {
        const menuDataForTranslation = {
            title: menuData.name || 'Menu',
            sections: menuData.categories?.map((cat: any) => ({
                id: cat.id,
                title: cat.name,
                items: cat.items?.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description || '',
                    price: item.price.toString(),
                    tags: buildTagsFromMenuItem(item)
                })) || []
            })) || []
        };
        return menuDataForTranslation;
    };

    const buildTagsFromMenuItem = (item: any): Array<'vegetarian' | 'vegan' | 'gluten-free' | 'spicy'> => {
        const tags: Array<'vegetarian' | 'vegan' | 'gluten-free' | 'spicy'> = [];
        if (item.isVegetarian) tags.push('vegetarian');
        if (item.isVegan) tags.push('vegan');
        if (item.isGlutenFree) tags.push('gluten-free');
        if (item.isSpicy) tags.push('spicy');
        return tags;
    };

    const formatTranslatedMenu = (translatedMenu: any): string => {
        let formatted = `**${translatedMenu.title}**\n\n`;
        
        translatedMenu.sections.forEach((section: any) => {
            formatted += `**${section.title}**\n`;
            section.items.forEach((item: any) => {
                formatted += `• ${item.name} - €${item.price}\n`;
                if (item.description) {
                    formatted += `  ${item.description}\n`;
                }
                if (item.tags.length > 0) {
                    formatted += `  Tags: ${item.tags.join(', ')}\n`;
                }
                formatted += '\n';
            });
            formatted += '\n';
        });
        
        return formatted;
    };

    const handleTranslationRequest = async (language: string) => {
        setIsChatLoading(true);
        
        // Add loading message
        const loadingMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: 'Translating...',
            isUser: false,
            timestamp: new Date()
        };
        setChatMessages(prev => [...prev, loadingMessage]);
        
        try {
            const menuDataForTranslation = prepareMenuForTranslation();
            const translatedMenu = await translateMenu({
                menu: JSON.stringify(menuDataForTranslation),
                language: language
            });
            const response = `Here's your menu translated to ${language}:\n\n${formatTranslatedMenu(translatedMenu)}`;
            
            // Replace loading message with actual response
            setChatMessages(prev => prev.map(msg => 
                msg.id === loadingMessage.id 
                    ? { ...msg, text: response }
                    : msg
            ));
        } catch (error) {
            console.error('Translation error:', error);
            setChatMessages(prev => prev.map(msg => 
                msg.id === loadingMessage.id 
                    ? { ...msg, text: "I'm sorry, I'm having trouble translating the menu right now. Please try again in a moment." }
                    : msg
            ));
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleGeneralQuestion = async (question: string) => {
        setIsChatLoading(true);
        
        // Add loading message
        const loadingMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: 'Thinking...',
            isUser: false,
            timestamp: new Date()
        };
        setChatMessages(prev => [...prev, loadingMessage]);
        
        try {
            const result = await askAiFromDb({
                restaurantId: getRestaurantId(),
                question: question,
                includeFaq: true
            });
            
            // Replace loading message with actual response
            setChatMessages(prev => prev.map(msg => 
                msg.id === loadingMessage.id 
                    ? { ...msg, text: result.answer }
                    : msg
            ));
        } catch (error) {
            console.error('AI response error:', error);
            setChatMessages(prev => prev.map(msg => 
                msg.id === loadingMessage.id 
                    ? { ...msg, text: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment." }
                    : msg
            ));
        } finally {
            setIsChatLoading(false);
        }
    };

    const toggleFavorite = (itemId: string) => {
        setFavorites(prev => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(itemId)) {
                newFavorites.delete(itemId);
            } else {
                newFavorites.add(itemId);
            }
            return newFavorites;
        });
    };

    const addToCart = (itemId: string) => {
        setCart(prev => ({
            ...prev,
            [itemId]: (prev[itemId] || 0) + 1
        }));
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[itemId] > 1) {
                newCart[itemId]--;
            } else {
                delete newCart[itemId];
            }
            return newCart;
        });
    };

    const getTotalItems = () => {
        return Object.values(cart).reduce((sum, count) => sum + count, 0);
    };

    const getTotalPrice = () => {
        let total = 0;
        Object.entries(cart).forEach(([itemId, quantity]) => {
            const item = menuData.categories?.flatMap((cat: any) => cat.items)?.find((item: any) => item.id === itemId);
            if (item) {
                total += item.price * quantity;
            }
        });
        return total;
    };

    const getCartItems = () => {
        const items: any[] = [];
        Object.entries(cart).forEach(([itemId, quantity]) => {
            const item = menuData.categories?.flatMap((cat: any) => cat.items)?.find((item: any) => item.id === itemId);
            if (item) {
                items.push({ ...item, quantity });
            }
        });
        return items;
    };

    return (
        <div className="relative min-h-screen" style={{ backgroundColor: displayTheme.backgroundColor }}>
            {/* Modern Header with Spanish flair */}
            <div className="relative overflow-visible">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br" style={{ background: `linear-gradient(to bottom right, ${displayTheme.primaryColor}, ${displayTheme.accentColor})` }}>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
                </div>

                {/* Header Content */}
                <div className="relative z-10 px-4 sm:px-6 py-6 sm:py-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Top Navigation */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <ChefHat className="w-6 h-6 text-white" />
                                </div>
                                {/* <div className="text-white">
                                    <div className="flex items-center space-x-2 text-sm opacity-90">
                                        <Clock className="w-4 h-4" />
                                        <span>Abierto: 12:00 - 23:00</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm opacity-90 mt-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>Calle Mayor 123, Madrid</span>
                                    </div>
                                </div> */}
                            </div>
                        </div>

                        {/* Restaurant Title */}
                        <div className="text-center text-white">
                            <h1 className="text-2xl sm:text-3xl font-bold mb-4" style={{ fontFamily: displayTheme.fontFamily }}>
                                {menuData.name || 'Menu Name'}
                            </h1>
                            {menuData.description && (
                                <p className="text-sm sm:text-base opacity-90 max-w-2xl mx-auto leading-relaxed">
                                    {menuData.description}
                                </p>
                            )}
                           
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
             {/* Search and Filters */}
             <div className="sticky top-0 z-40 bg-white/98 backdrop-blur-lg border-b border-gray-200 shadow-lg">
                <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search Bar */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search menu..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent shadow-sm transition-all duration-200 text-sm"
                                style={{ 
                                    '--tw-ring-color': displayTheme.primaryColor,
                                    focusRingColor: displayTheme.primaryColor 
                                } as React.CSSProperties}
                                onFocus={(e) => e.currentTarget.style.borderColor = displayTheme.primaryColor}
                            />
                        </div>

                        <div className="flex gap-2">
                            {/* Filter Button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2.5 text-white rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm text-sm"
                                style={{ backgroundColor: displayTheme.primaryColor }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = displayTheme.accentColor}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = displayTheme.primaryColor}
                            >
                                <Filter className="w-4 h-4" />
                                <span>Filters</span>
                            </button>
                            
                            {/* Language Selector */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowLanguageDropdown(!showLanguageDropdown);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm text-sm"
                                >
                                    <Globe className="w-4 h-4 text-gray-600" />
                                    <span className="text-base">{selectedLanguage.flag}</span>
                                    <span className="hidden sm:inline text-gray-700">{selectedLanguage.name}</span>
                                    <div className={`w-1.5 h-1.5 border-r-2 border-b-2 border-gray-400 transform transition-transform duration-200 ${
                                        showLanguageDropdown ? '-rotate-45 translate-y-0.5' : 'rotate-45 -translate-y-0.5'
                                    }`}></div>
                                </button>
                                
                                {showLanguageDropdown && (
                                    <>
                                        {/* Backdrop */}
                                        <div 
                                            className="fixed inset-0 z-[90]" 
                                            onClick={() => {
                                                setShowLanguageDropdown(false);
                                            }}
                                        />
                                        {/* Dropdown Menu */}
                                        <div 
                                            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-[110] max-h-48 overflow-y-auto"
                                            style={{
                                                position: 'absolute',
                                                top: '100%',
                                                right: 0,
                                                marginTop: '8px',
                                                scrollbarWidth: 'thin',
                                                scrollbarColor: '#e5e7eb transparent',
                                            }}
                                        >
                                            {languages.map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedLanguage(lang);
                                                        setShowLanguageDropdown(false);
                                                    }}
                                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 transition-colors text-sm rounded-lg mx-1"
                                                >
                                                    <span className="text-base">{lang.flag}</span>
                                                    <span className="text-gray-700">{lang.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            
                        </div>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Dietary Preferences</h3>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'all', label: 'All Items' },
                                    { value: 'vegetarian', label: 'Vegetarian' },
                                    { value: 'vegan', label: 'Vegan' },
                                    { value: 'gluten-free', label: 'Gluten-Free' },
                                    { value: 'spicy', label: 'Spicy' }
                                ].map((filter) => (
                                    <button
                                        key={filter.value}
                                        onClick={() => setDietaryFilter(filter.value)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                            dietaryFilter === filter.value
                                                ? 'text-white shadow-md'
                                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                        }`}
                                        style={dietaryFilter === filter.value ? { backgroundColor: displayTheme.primaryColor } : {}}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Full Screen Translation Loading Overlay */}
            {isTranslating && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-md w-full border border-gray-200">
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                                <Globe className="w-6 h-6 text-white animate-spin" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Translating Menu to  <span className="font-medium text-purple-600">{selectedLanguage.name}</span>
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Menu Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                
                {filteredCategories && filteredCategories.length > 0 ? (
                    filteredCategories.map((category: any) => {
                        // Get translated category data if available
                        const translatedCategory = translatedMenuData?.sections?.find((s: any) => s.id === category.id);
                        
                        return (
                            <div key={category.id} className="mb-8">
                                {/* Category Header */}
                                <div className="text-center mb-6">
                                    <h2
                                        className="text-xl sm:text-2xl font-bold mb-3"
                                        style={{ color: theme.primaryColor, fontFamily: theme.fontFamily }}
                                    >
                                        {translatedCategory?.title || category.name}
                                    </h2>
                                    {category.description && (
                                        <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
                                            {category.description}
                                        </p>
                                    )}
                                    <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-yellow-500 mx-auto mt-4 rounded-full"></div>
                                </div>

                            {/* Items Grid */}
                            <div className="grid gap-6">
                                {category.items
                                    .filter((item: any) => {
                                        if (!item.isAvailable) return false;
                                        
                                        const matchesSearch = !searchTerm || 
                                            item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            item.description?.toLowerCase().includes(searchTerm.toLowerCase());
                                        
                                        const matchesDietary = dietaryFilter === 'all' ||
                                            (dietaryFilter === 'vegetarian' && item.isVegetarian) ||
                                            (dietaryFilter === 'vegan' && item.isVegan) ||
                                            (dietaryFilter === 'gluten-free' && item.isGlutenFree) ||
                                            (dietaryFilter === 'spicy' && item.isSpicy);
                                        
                                        return matchesSearch && matchesDietary;
                                    })
                                    .map((item: any) => {
                                        // Get translated item data if available
                                        const translatedItem = translatedCategory?.items?.find((i: any) => i.id === item.id);
                                        
                                        return (
                                            <div
                                                key={item.id}
                                                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100"
                                            >
                                                <div className="p-4 sm:p-6">
                                                    <div className="flex flex-col sm:flex-row gap-4">
                                                        {/* Item Image/Icon */}
                                                        <div className="flex-shrink-0">
                                                            <div 
                                                                className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-200"
                                                                style={{ 
                                                                    background: `linear-gradient(to bottom right, ${displayTheme.primaryColor}20, ${displayTheme.accentColor}20)` 
                                                                }}
                                                            >
                                                                {item.image}
                                                            </div>
                                                        </div>

                                                        {/* Item Details */}
                                                        <div className="flex-1">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <h3
                                                                    className="text-lg sm:text-xl font-bold"
                                                                    style={{ color: displayTheme.primaryColor, fontFamily: displayTheme.fontFamily }}
                                                                >
                                                                    {translatedItem?.name || item.name}
                                                                </h3>
                                                                <div className="flex items-center gap-2 ml-4">
                                                                    <button
                                                                        onClick={() => toggleFavorite(item.id)}
                                                                        className={`p-2 rounded-full transition-colors ${
                                                                            favorites.has(item.id)
                                                                                ? 'bg-red-50'
                                                                                : 'text-gray-400 hover:bg-red-50'
                                                                        }`}
                                                                        style={{
                                                                            color: favorites.has(item.id) ? displayTheme.accentColor : undefined
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            if (!favorites.has(item.id)) {
                                                                                e.currentTarget.style.color = displayTheme.accentColor;
                                                                            }
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            if (!favorites.has(item.id)) {
                                                                                e.currentTarget.style.color = '#9CA3AF';
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Heart className={`w-5 h-5 ${favorites.has(item.id) ? 'fill-current' : ''}`} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <p className="text-gray-600 leading-relaxed mb-4 text-sm sm:text-base">
                                                                {translatedItem?.description || item.description}
                                                            </p>

                                                            <DietaryTags item={item} />

                                                            <div className="flex items-center justify-between mt-6">
                                                                <div className="flex items-center">
                                                                    <span
                                                                        className="text-lg sm:text-xl font-bold"
                                                                        style={{ color: displayTheme.accentColor }}
                                                                    >
                                                                        €{item.price.toFixed(2)}
                                                                    </span>
                                                                </div>

                                                                {/* Add to Cart */}
                                                                <div className="flex items-center gap-3">
                                                                    {cart[item.id] ? (
                                                                        <div className="flex items-center gap-3 rounded-xl px-4 py-2" style={{ backgroundColor: `${displayTheme.primaryColor}10` }}>
                                                                            <button
                                                                                onClick={() => removeFromCart(item.id)}
                                                                                className="p-1 rounded-lg transition-colors"
                                                                                style={{ color: displayTheme.primaryColor }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${displayTheme.primaryColor}20`}
                                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                            >
                                                                                <Minus className="w-4 h-4" />
                                                                            </button>
                                                                            <span className="font-semibold min-w-8 text-center" style={{ color: displayTheme.primaryColor }}>
                                                                                {cart[item.id]}
                                                                            </span>
                                                                            <button
                                                                                onClick={() => addToCart(item.id)}
                                                                                className="p-1 rounded-lg transition-colors"
                                                                                style={{ color: displayTheme.primaryColor }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${displayTheme.primaryColor}20`}
                                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                            >
                                                                                <Plus className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => addToCart(item.id)}
                                                                            className="text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                                                                            style={{ backgroundColor: displayTheme.primaryColor }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = displayTheme.accentColor}
                                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = displayTheme.primaryColor}
                                                                        >
                                                                            <Plus className="w-4 h-4" />
                                                                            <span>Add</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    );
                    })
                ) : (
                    <div className="text-center py-16">
                        <ChefHat className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">
                            {searchTerm || dietaryFilter !== 'all' ? 'No items found' : 'No menu items yet'}
                        </h3>
                        <p className="text-gray-500 text-sm">
                            {searchTerm || dietaryFilter !== 'all' 
                                ? 'Try adjusting your search or filters'
                                : 'Start adding categories and items to see your menu preview'
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Floating Cart Button */}
            {getTotalItems() > 0 && (
                <div className="fixed bottom-6 right-24 z-9">
                    <button 
                        onClick={() => setShowOrderModal(true)}
                        className="text-white px-4 py-3 rounded-2xl shadow-2xl transition-all duration-200 flex items-center gap-2 hover:scale-105 text-sm"
                        style={{ backgroundColor: displayTheme.primaryColor }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = displayTheme.accentColor}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = displayTheme.primaryColor}
                    >
                        <div className="relative">
                            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                <span className="font-bold text-xs" style={{ color: displayTheme.primaryColor }}>{getTotalItems()}</span>
                            </div>
                        </div>
                        <span className="font-semibold">View Order</span>
                    </button>
                </div>
            )}

            {/* Order Modal */}
            {showOrderModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
                        {/* Modal Header */}
                        <div 
                            className="p-4 text-white flex items-center justify-between"
                            style={{ backgroundColor: displayTheme.primaryColor }}
                        >
                            <div>
                                <h2 className="text-lg font-bold">Your Order</h2>
                                <p className="text-white/80 text-xs">{getTotalItems()} items</p>
                            </div>
                            <button
                                onClick={() => setShowOrderModal(false)}
                                className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Order Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
                            {getCartItems().map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div 
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                        style={{ 
                                            background: `linear-gradient(to bottom right, ${displayTheme.primaryColor}20, ${displayTheme.accentColor}20)` 
                                        }}
                                    >
                                        {item.image || '🍽️'}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                                        <p className="text-xs text-gray-600">€{item.price.toFixed(2)} each</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1 border">
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-gray-500 hover:text-gray-700 p-1"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="font-semibold min-w-6 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => addToCart(item.id)}
                                                className="text-gray-500 hover:text-gray-700 p-1"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold" style={{ color: displayTheme.accentColor }}>
                                                €{(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-base font-semibold text-gray-900">Total</span>
                                <span className="text-xl font-bold" style={{ color: displayTheme.accentColor }}>
                                    €{getTotalPrice().toFixed(2)}
                                </span>
                            </div>
                            <button
                                className="w-full text-white py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 shadow-lg"
                                style={{ backgroundColor: displayTheme.primaryColor }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = displayTheme.accentColor}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = displayTheme.primaryColor}
                            >
                                Proceed to Checkout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating AI Chat Button */}
            <div className="fixed bottom-6 right-6 z-50">
                {!showChat ? (
                    <AIChatButton onClick={() => setShowChat(true)} />
                ) : (
                    <ChatInterface
                        messages={chatMessages}
                        inputValue={chatInput}
                        onInputChange={setChatInput}
                        onSend={handleSendMessage}
                        onClose={() => setShowChat(false)}
                        onQuickAction={handleQuickAction}
                        isLoading={isChatLoading}
                        selectedLanguageFlag={selectedLanguage.flag}
                    />
                )}
            </div>


        </div>
    );
}