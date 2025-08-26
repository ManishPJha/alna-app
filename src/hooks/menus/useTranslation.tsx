'use client';

import { useCallback, useState } from 'react';

const translations: Record<string, Record<string, string>> = {
    en: {
        'search.placeholder': 'Search menu items...',
        'categories.all': 'All Categories',
        'cart.empty': 'Your cart is empty',
        'cart.checkout': 'Proceed to Checkout',
        'cart.clear': 'Clear Cart',
        'order.confirm': 'Confirm Order',
        'order.success': 'Order placed successfully!',
    },
    hi: {
        'search.placeholder': 'मेनू आइटम खोजें...',
        'categories.all': 'सभी श्रेणियां',
        'cart.empty': 'आपकी कार्ट खाली है',
        'cart.checkout': 'चेकआउट करें',
        'cart.clear': 'कार्ट साफ़ करें',
        'order.confirm': 'ऑर्डर की पुष्टि करें',
        'order.success': 'ऑर्डर सफलतापूर्वक दिया गया!',
    },
    es: {
        'search.placeholder': 'Buscar elementos del menú...',
        'categories.all': 'Todas las categorías',
        'cart.empty': 'Tu carrito está vacío',
        'cart.checkout': 'Proceder al pago',
        'cart.clear': 'Vaciar carrito',
        'order.confirm': 'Confirmar pedido',
        'order.success': '¡Pedido realizado con éxito!',
    },
};

export function useTranslation() {
    const [language, setLanguage] = useState('en');

    const t = useCallback(
        (key: string): string => {
            return translations[language]?.[key] || translations.en[key] || key;
        },
        [language]
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translateMenu = async (menu: any, targetLanguage: string) => {
        if (targetLanguage === 'en') return menu;

        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    menu: JSON.stringify(menu),
                    language: targetLanguage,
                }),
            });

            if (!response.ok) throw new Error('Translation failed');

            const translated = await response.json();
            return translated;
        } catch (error) {
            console.error('Translation error:', error);
            return menu; // Return original if translation fails
        }
    };

    return { language, setLanguage, t, translateMenu };
}
