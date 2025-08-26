'use client';

import Image from 'next/image';

interface AIChatButtonProps {
    onClick: () => void;
    isOnline?: boolean;
}

export function AIChatButton({ onClick, isOnline = true }: AIChatButtonProps) {
    return (
        <button
            onClick={onClick}
            className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 hover:rotate-3"
            style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
            }}
        >
            <div className="relative">
                <Image 
                    src="/alna_assistant.png" 
                    alt="AI Assistant" 
                    width={28} 
                    height={28}
                    className="rounded-lg"
                />
                {isOnline && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                )}
            </div>
        </button>
    );
} 