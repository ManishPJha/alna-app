'use client';

import { Send } from 'lucide-react';
import React from 'react';

interface ChatInputProps {
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onQuickAction: (
        type: 'translate' | 'vegetarian' | 'recommendations'
    ) => void;
    disabled?: boolean;
    isLoading?: boolean;
    selectedLanguageFlag?: string;
}

export function ChatInput({
    value,
    placeholder,
    onChange,
    onSend,
    onQuickAction,
    disabled = false,
    isLoading = false,
    selectedLanguageFlag,
}: ChatInputProps) {
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading && !disabled) {
            onSend();
        }
    };

    return (
        <div className="p-2 sm:p-3 bg-white border-t border-gray-200 rounded-b-2xl">
            {/* Quick Actions */}
            {/* <div className="flex gap-1 mb-2">
                <QuickActionButton
                    type="translate"
                    onClick={() => onQuickAction('translate')}
                    disabled={isLoading}
                    languageFlag={selectedLanguageFlag}
                />
                <QuickActionButton
                    type="vegetarian"
                    onClick={() => onQuickAction('vegetarian')}
                    disabled={isLoading}
                />
                <QuickActionButton
                    type="recommendations"
                    onClick={() => onQuickAction('recommendations')}
                    disabled={isLoading}
                />
            </div> */}

            <div className="flex gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    className="flex-1 px-2 sm:px-3 py-2 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs sm:text-sm bg-gray-50 focus:bg-white transition-colors"
                    disabled={disabled || isLoading}
                />
                <button
                    onClick={onSend}
                    disabled={!value.trim() || isLoading || disabled}
                    className="w-8 h-8 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center hover:scale-105"
                    style={{
                        background:
                            !value.trim() || isLoading || disabled
                                ? '#9CA3AF'
                                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    }}
                >
                    <Send className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
