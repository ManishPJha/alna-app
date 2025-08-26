'use client';

import Image from 'next/image';

export interface ChatMessageData {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

interface ChatMessageProps {
    message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
    return (
        <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
            {!message.isUser && (
                <div 
                    className="w-6 h-6 rounded-xl flex items-center justify-center mr-2 mt-1 flex-shrink-0 relative"
                    style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                    }}
                >
                    <Image 
                        src="/alna_assistant.png" 
                        alt="AI Assistant" 
                        width={12} 
                        height={12}
                        className="rounded-sm"
                    />
                </div>
            )}
            <div
                className={`max-w-[75%] px-3 py-1.5 rounded-2xl text-xs ${
                    message.isUser
                        ? 'text-white rounded-br-md shadow-lg'
                        : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                }`}
                style={message.isUser ? {
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                } : {}}
            >
                {message.text}
            </div>
        </div>
    );
} 