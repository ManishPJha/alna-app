'use client';

import { X } from 'lucide-react';
import Image from 'next/image';

interface ChatHeaderProps {
    title: string;
    onlineStatusText: string;
    offlineStatusText: string;
    onClose: () => void;
    isOnline?: boolean;
}

export function ChatHeader({
    title,
    onlineStatusText,
    offlineStatusText,
    onClose,
    isOnline = true,
}: ChatHeaderProps) {
    return (
        <div
            className="text-white p-2 sm:p-3 flex items-center justify-between rounded-t-2xl"
            style={{
                background:
                    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
            }}
        >
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center relative">
                    <Image
                        src="/alna_assistant.png"
                        alt="AI Assistant"
                        width={14}
                        height={14}
                        className="rounded-md sm:w-4 sm:h-4"
                    />
                    {isOnline && (
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    )}
                </div>
                <div>
                    <h3 className="font-semibold text-xs sm:text-sm">{title}</h3>
                    <div className="text-purple-100 text-xs flex items-center gap-1">
                        <div
                            className={`w-1.5 h-1.5 rounded-full ${
                                isOnline ? 'bg-green-400' : 'bg-gray-400'
                            }`}
                        ></div>
                        <span className="hidden sm:inline">{isOnline ? onlineStatusText : offlineStatusText}</span>
                        <span className="sm:hidden">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                </div>
            </div>
            <button
                onClick={onClose}
                className="text-purple-100 hover:text-white p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
