'use client';

import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { ChatMessage, ChatMessageData } from './ChatMessage';

interface ChatInterfaceProps {
    messages: ChatMessageData[];
    inputValue: string;
    onInputChange: (value: string) => void;
    onSend: () => void;
    onClose: () => void;
    onQuickAction: (type: 'translate' | 'vegetarian' | 'recommendations') => void;
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
    selectedLanguageFlag
}: ChatInterfaceProps) {
    return (
        <div className="w-96 sm:w-80 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            <ChatHeader onClose={onClose} />
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-gray-50 to-white">
                {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                ))}
            </div>

            <ChatInput
                value={inputValue}
                onChange={onInputChange}
                onSend={onSend}
                onQuickAction={onQuickAction}
                disabled={false}
                isLoading={isLoading}
                selectedLanguageFlag={selectedLanguageFlag}
            />
        </div>
    );
} 