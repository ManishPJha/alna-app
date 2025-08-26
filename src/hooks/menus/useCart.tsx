'use client';

import { Cart, CartItem, MenuItem } from '@/types/menu';
import { useEffect, useState } from 'react';

export function useCart() {
    const [cart, setCart] = useState<Cart>({
        items: [],
        total: 0,
        itemCount: 0,
    });

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('menuCart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('menuCart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item: MenuItem) => {
        setCart((prev) => {
            const existingItem = prev.items.find((i) => i.id === item.id);

            if (existingItem) {
                const updatedItems = prev.items.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                );
                return calculateTotals(updatedItems);
            } else {
                const newItem: CartItem = { ...item, quantity: 1 };
                return calculateTotals([...prev.items, newItem]);
            }
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart((prev) => {
            const updatedItems = prev.items.filter(
                (item) => item.id !== itemId
            );
            return calculateTotals(updatedItems);
        });
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(itemId);
            return;
        }

        setCart((prev) => {
            const updatedItems = prev.items.map((item) =>
                item.id === itemId ? { ...item, quantity } : item
            );
            return calculateTotals(updatedItems);
        });
    };

    const clearCart = () => {
        setCart({ items: [], total: 0, itemCount: 0 });
    };

    const calculateTotals = (items: CartItem[]): Cart => {
        const total = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        return { items, total, itemCount };
    };

    return { cart, addToCart, removeFromCart, updateQuantity, clearCart };
}
