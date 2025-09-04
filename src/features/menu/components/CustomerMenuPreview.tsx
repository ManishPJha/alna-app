'use client';

import { askAiFromDb } from '@/ai/flows/ask-ai-db-flow';
import { translateMenu } from '@/ai/flows/translate-menu-flow';
import { translateText } from '@/ai/flows/translate-text-flow';
import PhotoViewer from '@/components/common/PhotoViewer';
import { cookieName } from '@/config/i18n';
import AppImage from '@/shared/components/ui/image';
import { MenuFormData } from '@/types/menu';
import { ChefHat, Globe, Minus, Plus, ShoppingCart, X } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AIChatButton, ChatInterface } from './chat';
import { LanguageSelector } from './customer-menu';

interface ChatMessage {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

interface CustomerMenuPreviewProps {
    form: UseFormReturn<MenuFormData>;
}

const setLanguageCookie = (value: string) => {
    const oneYear = 60 * 60 * 24;
    document.cookie = `${cookieName}=${value}; Max-Age=${oneYear}; Path=/; SameSite=Lax`;
};

export function CustomerMenuPreview({ form }: CustomerMenuPreviewProps) {
    const menuData = form.watch();
    const theme = menuData.theme;
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { t, i18n } = useTranslation('menu-preview');

    const getRestaurantId = () => {
        if (params?.id) {
            const id = Array.isArray(params.id) ? params.id[0] : params.id;
            // Handle both menu-{restaurantId} format and direct menuId
            const match = id.match(/menu-(.+)/);
            return match ? match[1] : menuData.restaurantId || id;
        }
        return menuData.restaurantId || '1';
    };

    const getMenuId = () => {
        if (params?.id) {
            const id = Array.isArray(params.id) ? params.id[0] : params.id;
            // If it's already a direct menu ID (not menu-{restaurantId} format), use it
            if (!id.startsWith('menu-')) {
                return id;
            }
            // Otherwise, use the menu ID from form data
            return menuData.id || undefined;
        }
        return menuData.id || undefined;
    };

    // Default theme fallback
    const defaultTheme = {
        primaryColor: '#ef4444',
        backgroundColor: '#f8fafc',
        accentColor: '#dc2626',
        fontFamily: 'Inter',
    };

    const displayTheme = theme || defaultTheme;

    // State management
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [searchTerm] = useState('');
    const [dietaryFilter] = useState<string>('all');
    const [showSearchInput, setShowSearchInput] = useState(false);
    const [cart, setCart] = useState<{ [key: string]: number }>({});
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [tableNumber, setTableNumber] = useState<string>('');
    const [specialRequests, setSpecialRequests] = useState<string>('');
    const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
    const [orderFeedback, setOrderFeedback] = useState<string | null>(null);
    const [qrToken, setQrToken] = useState<string | null>(null);
    const [tables, setTables] = useState<string[]>([]);
    const [isTablesLoading, setIsTablesLoading] = useState<boolean>(false);

    // Language support
    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'bg', name: 'Български', flag: '🇧🇬' },
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
        { code: 'it', name: 'Italiano', flag: '🇮🇹' },
        { code: 'pt', name: 'Português', flag: '🇵🇹' },
        { code: 'ja', name: '日本語', flag: '🇯🇵' },
        { code: 'zh', name: '中文', flag: '🇨🇳' },
        { code: 'ko', name: '한국어', flag: '🇰🇷' },
    ];
    const [selectedLanguage, setSelectedLanguage] = useState(() => {
        const code = i18n?.language || 'en';
        return languages.find((l) => l.code === code) || languages[0];
    });
    const [translatedMenuData, setTranslatedMenuData] = useState<any>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    // Sync selected language from i18n (cookie-backed) on mount/changes
    useEffect(() => {
        const code = i18n?.language || 'en';
        const found = languages.find((l) => l.code === code);
        if (found && found.code !== selectedLanguage.code) {
            setSelectedLanguage(found);
            // keep cookie aligned
            setLanguageCookie(found.code);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [i18n?.language]);

    // Helper function to get the current menu data (translated or original)
    const getCurrentMenuData = () => {
        if (selectedLanguage.code !== 'en' && translatedMenuData) {
            return {
                ...menuData,
                name: translatedMenuData.title,
                description: translatedMenuData.description,
                restaurantName:
                    translatedMenuData.restaurantName ||
                    menuData.restaurantName,
                categories:
                    translatedMenuData.sections?.map((section: any) => ({
                        ...menuData.categories?.find(
                            (cat) => cat.id === section.id
                        ),
                        id: section.id,
                        name: section.title,
                        description: section.description,
                        items:
                            section.items?.map((translatedItem: any) => {
                                const originalItem = menuData.categories
                                    ?.flatMap((cat: any) => cat.items || [])
                                    ?.find(
                                        (item: any) =>
                                            item.id === translatedItem.id
                                    );

                                return {
                                    ...originalItem,
                                    name: translatedItem.name,
                                    description: translatedItem.description,
                                    price:
                                        originalItem?.price ||
                                        parseFloat(translatedItem.price) ||
                                        0,
                                };
                            }) || [],
                    })) || [],
            };
        }
        return menuData;
    };

    // Detect QR token from URL
    useEffect(() => {
        const token =
            searchParams?.get('qr') ||
            searchParams?.get('qrToken') ||
            searchParams?.get('token');
        setQrToken(token);
        if (token) {
            setTableNumber('');
        }
    }, [searchParams]);

    // Load available tables when opening modal without QR token
    useEffect(() => {
        const loadTables = async () => {
            if (!showOrderModal || qrToken) return;
            setIsTablesLoading(true);
            try {
                const qs = new URLSearchParams({
                    restaurantId: getRestaurantId(),
                });
                const res = await fetch(`/api/public/tables?${qs.toString()}`, {
                    cache: 'no-store',
                });
                const data = await res.json();
                if (!res.ok)
                    throw new Error(data?.error || 'Failed to load tables');
                const list = Array.isArray(data.tables) ? data.tables : [];
                
                // Remove duplicates and ensure unique table numbers
                const uniqueTables = [...new Set(list)].filter((item): item is string => 
                    typeof item === 'string' && item.trim().length > 0
                );
                
                // Debug logging to help identify duplicate sources
                if (list.length !== uniqueTables.length) {
                    console.warn('Duplicate tables detected:', {
                        original: list,
                        unique: uniqueTables,
                        duplicates: list.length - uniqueTables.length
                    });
                }
                
                setTables(uniqueTables);
                
                if (!tableNumber && uniqueTables.length > 0) {
                    setTableNumber(uniqueTables[0]);
                }
            } catch (e) {
                console.error('Load tables error:', e);
                setTables([]);
            } finally {
                setIsTablesLoading(false);
            }
        };
        
        if (showOrderModal && !qrToken) {
            loadTables();
        } else if (!showOrderModal) {
            // Reset table selection when modal closes
            setTableNumber('');
            setTables([]);
        }
    }, [showOrderModal, qrToken]);

    // Auto-translate menu when language changes
    useEffect(() => {
        if (selectedLanguage.code !== 'en') {
            translateMenuContent();
        } else {
            setTranslatedMenuData(null);
        }

        // Update i18n language when selectedLanguage changes
        if (i18n.language !== selectedLanguage.code) {
            i18n.changeLanguage(selectedLanguage.code);
        }
    }, [selectedLanguage, i18n]);

    // Compute a stable hash of the current menu content (language-agnostic)
    const computeMenuContentHash = () => {
        try {
            return JSON.stringify({
                name: menuData.name,
                description: menuData.description,
                restaurantName: (menuData as any).restaurantName,
                categories: menuData.categories?.map((cat: any) => ({
                    id: cat.id,
                    name: cat.name,
                    description: cat.description,
                    items: cat.items?.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        price: item.price,
                    })),
                })),
            });
        } catch {
            return undefined;
        }
    };

    // Detect menu updates and refresh translations
    useEffect(() => {
        if (selectedLanguage.code !== 'en' && menuData) {
            const menuId = getMenuId() || getRestaurantId();

            // Language-agnostic hash key for the menu
            const contentHashKey = `alna.translation.${
                menuId || 'default'
            }.contentHash`;
            const currentMenuHash = computeMenuContentHash();
            const cachedHash =
                typeof window !== 'undefined'
                    ? window.localStorage.getItem(contentHashKey)
                    : undefined;

            if (currentMenuHash && cachedHash !== currentMenuHash) {
                // Menu content has changed, clear all cached translations for this menu (all languages)
                clearMenuTranslations(menuId);
                window.localStorage.setItem(contentHashKey, currentMenuHash);
                // Force-refresh to skip any leftover cache and re-translate
                translateMenuContent(true);
            }
        }
    }, [menuData, selectedLanguage.code]);

    // Clear chat messages and set new welcome message when language changes
    useEffect(() => {
        if (showChat) {
            const welcomeMessage = t('ai.ai_chat_welcome_message');

            setChatMessages([
                {
                    id: '1',
                    text: welcomeMessage,
                    isUser: false,
                    timestamp: new Date(),
                },
            ]);
        }
    }, [showChat, selectedLanguage.code, t]);

    // Handle keyboard events and click outside for search input
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && showSearchInput) {
                setShowSearchInput(false);
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (showSearchInput && !target.closest('.search-input-container')) {
                setShowSearchInput(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSearchInput]);

    const translateMenuContent = async (forceRefresh = false) => {
        if (selectedLanguage.code === 'en') return;

        setIsTranslating(true);

        try {
            const menuId = getMenuId() || getRestaurantId();
            const cacheKey = getTranslationCacheKey(
                selectedLanguage.code,
                menuId
            );

            // Try cache first (unless forcing refresh)
            if (!forceRefresh) {
                const cached = loadTranslationFromCache(cacheKey);
                if (cached) {
                    setTranslatedMenuData(cached);
                    // Ensure content hash is saved for invalidation, even when using cache
                    const contentHashKey = `alna.translation.${
                        menuId || 'default'
                    }.contentHash`;
                    const currentMenuHash = computeMenuContentHash();
                    const existingHash =
                        typeof window !== 'undefined'
                            ? window.localStorage.getItem(contentHashKey)
                            : undefined;
                    if (currentMenuHash && !existingHash) {
                        window.localStorage.setItem(
                            contentHashKey,
                            currentMenuHash
                        );
                    }
                    return;
                }
            }

            const menuDataForTranslation = prepareMenuForTranslation();
            const translated = await translateMenu({
                menu: JSON.stringify(menuDataForTranslation),
                language: selectedLanguage.name,
            });
            setTranslatedMenuData(translated);
            saveTranslationToCache(cacheKey, translated);
            // Persist latest menu content hash (language-agnostic) after a successful translation
            const contentHashKey = `alna.translation.${
                menuId || 'default'
            }.contentHash`;
            const currentMenuHash = computeMenuContentHash();
            if (currentMenuHash) {
                window.localStorage.setItem(contentHashKey, currentMenuHash);
            }
        } catch (error: any) {
            console.error('Menu translation error:', error);
            setTranslatedMenuData(null);
            // Notify user with selected language context
            try {
                const langLabel = selectedLanguage?.name || selectedLanguage?.code || 'selected language';
                toast.error(`Server is busy. Failed to translate menu to ${langLabel}. Please try again.`);
            } catch {
                // no-op if toast fails
            }
        } finally {
            setIsTranslating(false);
        }
    };

    // Simple localStorage cache for translated menus
    const getTranslationCacheKey = (lang: string, id: string | undefined) => {
        return `alna.translation.${id ?? 'default'}.${lang}`;
    };

    const loadTranslationFromCache = (key: string) => {
        if (typeof window === 'undefined') return null;
        try {
            const raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };

    const saveTranslationToCache = (key: string, value: any) => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // ignore quota errors
        }
    };

    // Clear all cached translations for a specific menu
    const clearMenuTranslations = (menuId?: string) => {
        if (typeof window === 'undefined') return;
        try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                if (
                    key &&
                    key.startsWith(`alna.translation.${menuId || 'default'}`)
                ) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach((key) => window.localStorage.removeItem(key));
        } catch {
            // ignore errors
        }
    };

    // Translate arbitrary text to English if needed
    const translateToEnglishIfNeeded = async (
        text: string
    ): Promise<string> => {
        if (!text) return text;
        try {
            const res = await translateText({
                text,
                targetLanguage: 'English',
            });
            return res.translated || text;
        } catch (e) {
            console.error(
                'Special requests translation failed. Using original text.',
                e
            );
            return text;
        }
    };

    const prepareMenuForTranslation = () => {
        const menuDataForTranslation = {
            title: menuData.name || 'Menu',
            description: menuData.description || '',
            restaurantName: menuData.restaurantName || '',
            sections:
                menuData.categories?.map((cat: any) => ({
                    id: cat.id,
                    title: cat.name,
                    description: cat.description || '',
                    items:
                        cat.items?.map((item: any) => ({
                            id: item.id,
                            name: item.name,
                            description: item.description || '',
                            price: item.price.toString(),
                            tags: buildTagsFromMenuItem(item),
                        })) || [],
                })) || [],
        };
        return menuDataForTranslation;
    };

    const buildTagsFromMenuItem = (
        item: any
    ): Array<'vegetarian' | 'vegan' | 'gluten-free' | 'spicy'> => {
        const tags: Array<'vegetarian' | 'vegan' | 'gluten-free' | 'spicy'> =
            [];
        if (item.isVegetarian) tags.push('vegetarian');
        if (item.isVegan) tags.push('vegan');
        if (item.isGlutenFree) tags.push('gluten-free');
        if (item.isSpicy) tags.push('spicy');
        return tags;
    };

    const handleQuickAction = (
        type: 'translate' | 'vegetarian' | 'recommendations'
    ) => {
        let message = '';

        switch (type) {
            case 'translate':
                message = `Translate menu to ${selectedLanguage.name}`;
                break;
            case 'vegetarian':
                message = 'What are your vegetarian options?';
                break;
            case 'recommendations':
                message = 'Can you recommend something?';
                break;
        }

        setChatInput(message);
        setTimeout(() => {
            const userMessage: ChatMessage = {
                id: Date.now().toString(),
                text: message,
                isUser: true,
                timestamp: new Date(),
            };
            setChatMessages((prev) => [...prev, userMessage]);
            setChatInput('');

            if (type === 'translate') {
                handleTranslationRequest(selectedLanguage.name);
            } else {
                handleGeneralQuestion(message);
            }
        }, 0);
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isChatLoading) return;

        setIsChatLoading(true);

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            text: chatInput,
            isUser: true,
            timestamp: new Date(),
        };

        setChatMessages((prev) => [...prev, userMessage]);
        const currentInput = chatInput;
        setChatInput('');

        const loadingMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: t('ai.ai_chat_loading_text'),
            isUser: false,
            timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, loadingMessage]);

        try {
            // FIXED: Pass menuId to provide more specific context
            const result = await askAiFromDb({
                restaurantId: getRestaurantId(),
                menuId: getMenuId(), // Include specific menu ID if available
                question: currentInput,
                includeFaq: true,
                language: selectedLanguage.code,
            });

            setChatMessages((prev) =>
                prev.map((msg) =>
                    msg.id === loadingMessage.id
                        ? { ...msg, text: result.answer }
                        : msg
                )
            );
        } catch (error) {
            console.error('AI response error:', error);

            const errorMessage = t('ai.ai_chat_error_message');

            setChatMessages((prev) =>
                prev.map((msg) =>
                    msg.id === loadingMessage.id
                        ? {
                              ...msg,
                              text: errorMessage,
                          }
                        : msg
                )
            );
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleTranslationRequest = async (language: string) => {
        // Implementation placeholder - could trigger translation
        console.log('Translation requested for:', language);
    };

    const handleGeneralQuestion = async (question: string) => {
        // Implementation placeholder - could handle specific question types
        console.log('General question:', question);
    };

    const addToCart = (itemId: string) => {
        setCart((prev) => ({
            ...prev,
            [itemId]: (prev[itemId] || 0) + 1,
        }));
    };

    const removeFromCart = (itemId: string) => {
        setCart((prev) => {
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
        const currentMenu = getCurrentMenuData();
        Object.entries(cart).forEach(([itemId, quantity]) => {
            const item = currentMenu.categories
                ?.flatMap((cat: any) => cat.items || [])
                ?.find((item: any) => item.id === itemId);
            if (item) {
                // Ensure price is treated as number
                const itemPrice =
                    typeof item.price === 'number'
                        ? item.price
                        : parseFloat(item.price) || 0;
                total += itemPrice * quantity;
            }
        });
        return total;
    };

    const buildOrderItems = () => {
        const items: Array<{
            menuItemId: string;
            quantity: number;
            unitPrice: number;
        }> = [];
        const currentMenu = getCurrentMenuData();
        Object.entries(cart).forEach(([itemId, quantity]) => {
            const item = currentMenu.categories
                ?.flatMap((cat: any) => cat.items || [])
                ?.find((it: any) => it.id === itemId);
            if (item && quantity > 0) {
                // Ensure price is treated as number
                const itemPrice =
                    typeof item.price === 'number'
                        ? item.price
                        : parseFloat(item.price) || 0;
                items.push({
                    menuItemId: itemId,
                    quantity,
                    unitPrice: itemPrice,
                });
            }
        });
        return items;
    };

    const handleCloseOrderModal = () => {
        setShowOrderModal(false);
        setTableNumber('');
        setTables([]);
        setSpecialRequests('');
        setOrderFeedback(null);
    };

    const placeOrder = async () => {
        if (isPlacingOrder) return;
        const items = buildOrderItems();
        if (items.length === 0) return;

        setIsPlacingOrder(true);
        setOrderFeedback(null);
        try {
            const specialRequestsEnglish = await translateToEnglishIfNeeded(
                specialRequests
            );
            const payload = {
                restaurantId: getRestaurantId(),
                menuId: getMenuId(), // Include menu ID for order context
                tableNumber: qrToken ? undefined : tableNumber || undefined,
                qrToken: qrToken || undefined,
                customerLanguage: selectedLanguage.code,
                originalLanguage: 'en',
                specialRequests:
                    (specialRequestsEnglish || specialRequests || '').trim() ||
                    undefined,
                items,
            };

            const res = await fetch('/api/public/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || 'Failed to place order');
            }
            setCart({});
            setSpecialRequests('');
            setTableNumber('');
            setTables([]);
            setShowOrderModal(false);
            setOrderFeedback(null);
            toast.success(t('cart.order_success'));
        } catch (err: any) {
            setOrderFeedback('Failed to place order');
            console.error('Place order error:', err);
        } finally {
            setIsPlacingOrder(false);
        }
    };

    // Use current menu data for filtering
    const currentMenu = getCurrentMenuData();

    const getFilteredItems = () => {
        const allItems =
            currentMenu.categories?.flatMap(
                (cat: any) =>
                    cat.items?.filter(
                        (item: any) => item.isAvailable !== false
                    ) || []
            ) || [];

        return allItems.filter((item: any) => {
            const matchesSearch =
                !searchTerm ||
                item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase());

            const matchesDietary =
                dietaryFilter === 'all' ||
                (dietaryFilter === 'vegetarian' && item.isVegetarian) ||
                (dietaryFilter === 'vegan' && item.isVegan) ||
                (dietaryFilter === 'gluten-free' && item.isGlutenFree) ||
                (dietaryFilter === 'spicy' && item.isSpicy);

            return matchesSearch && matchesDietary;
        });
    };

    // Menu item component
    const MenuItem = ({ item }: { item: any }) => {
        return (
            <div className="flex gap-3 items-start">
                <div className="w-12 h-12 md:w-15 md:h-15 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {/* {item.image || '🍽️'} */}
                    {item.imageUrl ? (
                        <PhotoViewer src={item.imageUrl} alt={item.name} />
                    ) : (
                        '🍽️'
                    )}
                </div>
                <div className="flex justify-between items-start gap-2 md:gap-3 flex-1">
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base mb-1">
                            {item.name}
                        </h3>
                        <div className="flex flex-wrap gap-1 mb-2">
                            {item.isVegetarian && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                    {t('dietary_tags.vegetarian')}
                                </span>
                            )}
                            {item.isVegan && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                    {t('dietary_tags.vegan')}
                                </span>
                            )}
                            {item.isGlutenFree && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                    {t('dietary_tags.gluten_free')}
                                </span>
                            )}
                            {item.isSpicy && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                    {t('dietary_tags.spicy')}
                                </span>
                            )}
                        </div>
                        {item.description && (
                            <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                                {item.description}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span
                            className="font-semibold text-gray-900 text-sm md:text-base min-w-fit"
                            style={{ color: displayTheme.accentColor }}
                        >
                            ${item.price.toFixed(2)}
                        </span>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => removeFromCart(item.id)}
                                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-medium text-sm min-w-4 text-center">
                                {cart[item.id] || 0}
                            </span>
                            <button
                                onClick={() => addToCart(item.id)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white transition-colors"
                                style={{
                                    backgroundColor: displayTheme.primaryColor,
                                }}
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Get categories and organize them for the layout
    const categories =
        currentMenu.categories?.filter((cat: any) => cat.isActive !== false) ||
        [];
    const filteredItems = getFilteredItems();

    // Organize items by category
    const getCategoryItems = (categoryId: string) => {
        return filteredItems.filter((item: any) =>
            categories
                .find((cat: any) => cat.id === categoryId)
                ?.items?.some((catItem: any) => catItem.id === item.id)
        );
    };

    return (
        <div
            className="min-h-screen"
            style={{ backgroundColor: displayTheme.backgroundColor }}
        >
            {/* Desktop Layout */}
            <div className="hidden lg:block min-h-screen">
                {/* Desktop Header - Transparent */}
                {/* <div className="px-6 py-4 bg-white/30 backdrop-blur-md border-b border-white/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                                    style={{
                                    backgroundColor: displayTheme.primaryColor,
                                    }}
                                >
                                    <ChefHat className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: displayTheme.fontFamily }}>
                                        {currentMenu.restaurantName}
                                    </h1>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                    <LanguageSelector
                                        languages={languages}
                                        selectedLanguage={selectedLanguage}
                                        onSelectLanguage={async (language) => {
                                            setSelectedLanguage(language);
                                            await i18n.changeLanguage(language.code);
                                            setLanguageCookie(language.code);
                                            router.refresh();
                                        }}
                                        theme={displayTheme}
                                    />
                            </div>
                        </div>
                    </div> */}

                {/* Desktop Menu Layout */}
                <div className="p-6 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Menu Header */}
                        {/* <div className="flex items-center justify-left mb-8">
                            <div className="flex items-center space-x-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                                    style={{
                                        backgroundColor:
                                            displayTheme.primaryColor,
                                    }}
                                >
                                    <ChefHat className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1
                                        className="text-xl font-bold text-gray-900"
                                        style={{
                                            fontFamily: displayTheme.fontFamily,
                                        }}
                                    >
                                        {currentMenu.restaurantName}
                                    </h1>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <LanguageSelector
                                    languages={languages}
                                    selectedLanguage={selectedLanguage}
                                    onSelectLanguage={async (language) => {
                                        setSelectedLanguage(language);
                                        await i18n.changeLanguage(
                                            language.code
                                        );
                                        setLanguageCookie(language.code);
                                        router.refresh();
                                    }}
                                    theme={displayTheme}
                                />
                            </div>
                        </div> */}
                        <div className="relative mb-6">
                            <div className="absolute right-0 top-0">
                                <LanguageSelector
                                    languages={languages}
                                    selectedLanguage={selectedLanguage}
                                    onSelectLanguage={async (language) => {
                                        setSelectedLanguage(language);
                                        await i18n.changeLanguage(language.code);
                                        setLanguageCookie(language.code);
                                        router.refresh();
                                    }}
                                    theme={displayTheme}
                                />
                            </div>

                            <div className="text-center">
                                <h1
                                    className="text-5xl md:text-6xl font-serif mb-2 text-balance"
                                    style={{
                                        color: displayTheme.primaryColor,
                                        fontFamily: displayTheme.fontFamily,
                                    }}
                                >
                                    {currentMenu.name}
                                </h1>
                                {currentMenu.description && (
                                    <p
                                        className="text-lg font-medium tracking-wider"
                                        style={{ color: displayTheme.primaryColor }}
                                    >
                                        {currentMenu.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Menu Content - 2-Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-17">
                            {categories.map((category: any) => {
                                const categoryItems = getCategoryItems(
                                    category.id
                                );
                                if (categoryItems.length === 0) return null;

                                return (
                                    <div
                                        key={category.id}
                                        className="space-y-6 md:space-y-8"
                                    >
                                        <div>
                                            <h2
                                                className="text-lg md:text-xl font-bold tracking-wider"
                                                style={{
                                                    color: displayTheme.primaryColor,
                                                }}
                                            >
                                                {category.name?.toUpperCase()}
                                            </h2>
                                            {category.description && (
                                                <p className="text-sm text-gray-600">
                                                    {category.description}
                                                </p>
                                            )}
                                            <hr
                                                className=" md:my-2 border-t"
                                                style={{
                                                    borderColor:
                                                        displayTheme.primaryColor +
                                                        '40',
                                                }}
                                            />
                                            <div className="space-y-3 md:space-y-4">
                                                {categoryItems.map(
                                                    (
                                                        item: any,
                                                        index: number
                                                    ) => (
                                                        <MenuItem
                                                            key={`${
                                                                category.id
                                                            }-${
                                                                item.id ||
                                                                `item-${index}`
                                                            }`}
                                                            item={item}
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Desktop Cart Button */}
                {getTotalItems() > 0 && (
                    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                        <button
                            onClick={() => setShowOrderModal(true)}
                            className="text-white px-8 py-4 rounded-xl shadow-2xl transition-all duration-200 flex items-center gap-4 hover:scale-105"
                            style={{
                                backgroundColor: displayTheme.primaryColor,
                            }}
                        >
                            <ShoppingCart className="w-5 h-5" />
                            <span className="font-semibold">
                                {t('cart.view_cart_btn')}
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                                    {getTotalItems()}
                                </span>
                                <span className="font-bold">
                                    ${getTotalPrice().toFixed(2)}
                                </span>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden min-h-screen flex flex-col">
                {/* Mobile Header - Transparent */}
                <div className="bg-white/40 backdrop-blur-md border-b border-white/20">
                    <div className="px-4 py-4">
                        <div className="relative">
                            <div className="absolute right-0 top-0">
                                <LanguageSelector
                                    languages={languages}
                                    selectedLanguage={selectedLanguage}
                                    onSelectLanguage={async (language) => {
                                        setSelectedLanguage(language);
                                        await i18n.changeLanguage(language.code);
                                        setLanguageCookie(language.code);
                                    }}
                                    isMobile={true}
                                    theme={displayTheme}
                                />
                            </div>

                            <div className="text-center">
                                <h1
                                    className="text-xl text-bold text-gray-900"
                                    style={{ fontFamily: displayTheme.fontFamily , color: displayTheme.primaryColor}}
                                >
                                    {currentMenu.name}
                                </h1>
                                {currentMenu.description && (
                                    <p
                                        className="text-sm font-medium tracking-wider"
                                        style={{ color: displayTheme.primaryColor }}
                                    >
                                        {currentMenu.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* <SearchAndFilters
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        showFilters={showFilters}
                        onToggleFilters={() => setShowFilters(!showFilters)}
                        dietaryFilter={dietaryFilter}
                        onDietaryFilterChange={setDietaryFilter}
                        theme={displayTheme}
                        isMobile={true}
                    /> */}

                {/* Mobile Menu Items */}
                <div className="px-4 py-4 pb-24 flex-1 mb-10">

                    {filteredItems.length > 0 ? (
                        <div className="space-y-6">
                            {categories.map((category: any) => {
                                const categoryItems = getCategoryItems(
                                    category.id
                                );
                                if (categoryItems.length === 0) return null;

                                return (
                                    <div key={category.id}>
                                        <h2
                                            className="text-lg font-bold"
                                            style={{
                                                color: displayTheme.primaryColor,
                                            }}
                                        >
                                            {category.name?.toUpperCase()}
                                        </h2>
                                        {category.description && (
                                            <p className="text-sm text-gray-600">
                                                {category.description}
                                            </p>
                                        )}
                                        <hr
                                            className="my-2 border-t"
                                            style={{
                                                borderColor:
                                                    displayTheme.primaryColor +
                                                    '40',
                                            }}
                                        />
                                        <div className="space-y-4">
                                            {categoryItems.map(
                                                (item: any, index: number) => (
                                                    <MenuItem
                                                        key={`${category.id}-${
                                                            item.id ||
                                                            `item-${index}`
                                                        }`}
                                                        item={item}
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <ChefHat className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                No items found
                            </h3>
                            <p className="text-gray-500">
                                Try adjusting your search or filters
                            </p>
                        </div>
                    )}
                </div>

                {/* Mobile Bottom Cart Bar */}
                {getTotalItems() > 0 && !showOrderModal && (
                    <div className="fixed bottom-0 left-0 right-0 shadow-lg z-50">
                        <div className="px-4 py-4">
                            <button
                                onClick={() => setShowOrderModal(true)}
                                className="w-full text-white py-4 rounded-xl font-semibold text-base flex items-center justify-between shadow-sm"
                                style={{
                                    backgroundColor: displayTheme.primaryColor,
                                }}
                            >
                                <div className="flex items-center gap-2 px-4">
                                    <ShoppingCart className="w-5 h-5" />
                                    <span>{t('cart.view_cart_btn')}</span>
                                </div>
                                <div className="flex items-center gap-3 px-4">
                                    <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                                        {getTotalItems()}
                                    </span>
                                    <span>${getTotalPrice().toFixed(2)}</span>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Order Modal */}
            {showOrderModal && (
                                <div 
                    className="fixed inset-0 bg-black/50 z-[60] flex items-end lg:items-center lg:justify-center"
                    onClick={(e) => {
                        // Close modal when clicking on backdrop
                        if (e.target === e.currentTarget) {
                            handleCloseOrderModal();
                        }
                    }}
                >
                    <div
                        className="bg-white/80 backdrop-blur-md rounded-t-3xl lg:rounded-2xl w-full lg:w-[500px] lg:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
                        onClick={(e) => {
                            // Prevent event bubbling when clicking inside the modal
                            e.stopPropagation();
                        }}
                    >
                        <div
                            className="p-4 border-b flex items-center justify-between"
                            style={{
                                borderColor: displayTheme.primaryColor + '20',
                            }}
                        >
                            <h2
                                className="text-lg font-bold"
                                style={{ color: displayTheme.primaryColor }}
                            >
                                {t('cart.cart_modal_title')}
                            </h2>
                            <button
                                onClick={handleCloseOrderModal}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                style={
                                    {
                                        '--tw-ring-color':
                                            displayTheme.primaryColor,
                                    } as React.CSSProperties
                                }
                            >
                                <X
                                    className="w-5 h-5"
                                    style={{ color: displayTheme.primaryColor }}
                                />
                            </button>
                        </div>

                        <div className="p-4 space-y-4 overflow-y-auto flex-1">
                            <div className="space-y-3">
                                {qrToken ? (
                                    <div className="text-sm text-gray-600">
                                        {t('cart.cart_modal_identify_table')}
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {t(
                                                'cart.cart_modal_dropdown_title'
                                            )}
                                        </label>
                                        <select
                                            value={tableNumber}
                                            onChange={(e) =>
                                                setTableNumber(e.target.value)
                                            }
                                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 bg-white text-black transition-colors"
                                            style={
                                                {
                                                    borderColor:
                                                        displayTheme.primaryColor +
                                                        '30',
                                                    '--tw-ring-color':
                                                        displayTheme.primaryColor,
                                                } as React.CSSProperties
                                            }
                                        >
                                            <option value="" disabled>
                                                {isTablesLoading
                                                    ? t(
                                                          'cart.cart_modal_table_loading_text'
                                                      )
                                                    : t(
                                                          'cart.cart_modal_dropdown'
                                                      )}
                                            </option>
                                            {tables.map((t, i) => (
                                                <option key={i} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>
                                        {!isTablesLoading &&
                                            tables.length === 0 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {t(
                                                        'cart.cart_modal_dropdown_description'
                                                    )}
                                                </p>
                                            )}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t(
                                            'cart.cart_modal_order_additional_notes'
                                        )}
                                    </label>
                                    <textarea
                                        value={specialRequests}
                                        onChange={(e) =>
                                            setSpecialRequests(e.target.value)
                                        }
                                        rows={3}
                                        placeholder={t(
                                            'cart.cart_modal_order_additional_notes_placeholder'
                                        )}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-black transition-colors"
                                        style={
                                            {
                                                borderColor:
                                                    displayTheme.primaryColor +
                                                    '30',
                                                '--tw-ring-color':
                                                    displayTheme.primaryColor,
                                            } as React.CSSProperties
                                        }
                                    />
                                </div>
                                {orderFeedback && (
                                    <div className="text-sm text-red-600">
                                        {orderFeedback}
                                    </div>
                                )}
                            </div>
                            {Object.entries(cart).map(([itemId, quantity]) => {
                                const item = currentMenu.categories
                                    ?.flatMap((cat: any) => cat.items || [])
                                    ?.find((item: any) => item.id === itemId);
                                if (!item) return null;

                                // Ensure price is treated as number
                                const itemPrice =
                                    typeof item.price === 'number'
                                        ? item.price
                                        : parseFloat(item.price) || 0;

                                return (
                                    <div
                                        key={itemId}
                                        className="flex items-center gap-3 p-3 rounded-xl border transition-colors"
                                        style={{
                                            backgroundColor:
                                                displayTheme.primaryColor +
                                                '05',
                                            borderColor:
                                                displayTheme.primaryColor +
                                                '20',
                                        }}
                                    >
                                        <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center text-lg">
                                            {item.imageUrl ? (
                                                <AppImage
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                    height={100}
                                                    width={100}
                                                />
                                            ) : (
                                                '🍽️'
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-sm text-black">
                                                {item.name}
                                            </h3>
                                            <p className="text-xs text-black">
                                                {t(
                                                    'cart.cart_modal_order_item_price_desc',
                                                    {
                                                        price: itemPrice.toFixed(
                                                            2
                                                        ),
                                                    }
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    removeFromCart(itemId)
                                                }
                                                className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="font-medium text-sm min-w-4 text-center text-black">
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    addToCart(itemId)
                                                }
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                                                style={{
                                                    backgroundColor:
                                                        displayTheme.primaryColor,
                                                }}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className="font-bold text-sm"
                                                style={{
                                                    color: displayTheme.primaryColor,
                                                }}
                                            >
                                                $
                                                {(
                                                    item.price * quantity
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div
                            className="p-4 border-t"
                            style={{
                                borderColor: displayTheme.primaryColor + '20',
                                backgroundColor:
                                    displayTheme.primaryColor + '05',
                            }}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-lg font-semibold text-black">
                                    {t('cart.cart_modal_order_price_total')}
                                </span>
                                <span
                                    className="text-xl font-bold"
                                    style={{ color: displayTheme.primaryColor }}
                                >
                                    ${getTotalPrice().toFixed(2)}
                                </span>
                            </div>
                            <button
                                disabled={
                                    isPlacingOrder ||
                                    getTotalItems() === 0 ||
                                    (!qrToken && !tableNumber)
                                }
                                onClick={placeOrder}
                                className={`w-full text-white py-4 rounded-xl font-semibold text-base ${
                                    isPlacingOrder
                                        ? 'opacity-70 cursor-not-allowed'
                                        : ''
                                }`}
                                style={{
                                    backgroundColor: displayTheme.primaryColor,
                                }}
                            >
                                {isPlacingOrder
                                    ? t('cart.cart_modal_order_btn_loading')
                                    : t('cart.cart_modal_order_btn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Chat */}
            {!showOrderModal && (
                <div className="fixed bottom-20 lg:bottom-10 right-4 z-50">
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
            )}

            {/* Translation Loading */}
            {isTranslating && (
                <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm">
                        <div className="text-center">
                            <Globe
                                className="w-8 h-8 mx-auto mb-3 animate-spin"
                                style={{ color: displayTheme.primaryColor }}
                            />
                            <h3 className="font-semibold mb-1">
                                Translating Menu
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Please wait...
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
