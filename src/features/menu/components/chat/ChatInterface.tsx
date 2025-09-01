'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { ChatMessage, ChatMessageData } from './ChatMessage';

interface ChatInterfaceProps {
    messages: ChatMessageData[];
    inputValue: string;
    onInputChange: (value: string) => void;
    onSend: () => void;
    onClose: () => void;
    onQuickAction: (
        type: 'translate' | 'vegetarian' | 'recommendations'
    ) => void;
    isLoading?: boolean;
    selectedLanguageFlag?: string;
}

export function ChatInterface({
    messages,
    inputValue,
    onInputChange,
    onSend,
    onClose,
    onQuickAction,
    isLoading = false,
    selectedLanguageFlag,
}: ChatInterfaceProps) {
    const { t } = useTranslation('menu-preview');

    // Disable background scroll when chat is open (only on mobile)
    useEffect(() => {
        const isMobile = window.innerWidth < 640; // sm breakpoint
        if (isMobile) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, []);

    return (
        <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
            <div className="w-[calc(100vw-2rem)] sm:w-80 h-[calc(100vh-8rem)] sm:h-[500px] max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
                <ChatHeader
                    title={t('ai.ai_chat_title')}
                    onlineStatusText={t('ai.ai_chat_online_status_text')}
                    offlineStatusText={t('ai.ai_chat_offline_status_text')}
                    onClose={onClose}
                    isOnline={true}
                />

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 bg-gradient-to-b from-gray-50 to-white">
                    {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                    ))}
                </div>

                <ChatInput
                    value={inputValue}
                    placeholder={t('ai.ai_chat_placeholder')}
                    onChange={onInputChange}
                    onSend={onSend}
                    onQuickAction={onQuickAction}
                    disabled={false}
                    isLoading={isLoading}
                    selectedLanguageFlag={selectedLanguageFlag}
                />
            </div>
        </div>
    );
}
