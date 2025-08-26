'use client';

import { X } from 'lucide-react';
import Image from 'next/image';

interface ChatHeaderProps {
    onClose: () => void;
    isOnline?: boolean;
}

export function ChatHeader({ onClose, isOnline = true }: ChatHeaderProps) {
    return (
        <div 
            className="text-white p-3 flex items-center justify-between rounded-t-2xl"
            style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'
            }}
        >
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center relative">
                    <Image 
                        src="/alna_assistant.png" 
                        alt="AI Assistant" 
                        width={16} 
                        height={16}
                        className="rounded-md"
                    />
                    {isOnline && (
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    )}
                </div>
                <div>
                    <h3 className="font-semibold text-xs">AI Menu Assistant</h3>
                    <p className="text-purple-100 text-xs flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                        {isOnline ? 'Online & Ready' : 'Offline'}
                    </p>
                </div>
            </div>
            <button
                onClick={onClose}
                className="text-purple-100 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
} 