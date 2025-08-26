'use client';

import { MenuItem } from '@/types/menu';
import { Bot, MessageCircle, Send, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

interface AIChatbotProps {
    isOpen: boolean;
    onToggle: () => void;
    menuItems: MenuItem[];
    restaurantId: string;
}

export function AIChatbot({
    isOpen,
    onToggle,
    menuItems,
    restaurantId,
}: AIChatbotProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hi! I'm your menu assistant. Ask me anything about our menu - like 'What's spicy?', 'Show me vegan options', or 'What can I get under ₹300?'",
            sender: 'bot',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: input,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    restaurantId,
                    context: 'menu',
                }),
            });

            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text:
                    data.answer ||
                    "I'm sorry, I couldn't process that request. Please try again.",
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "I'm having trouble connecting right now. Please try again later.",
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={onToggle}
                className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-40"
            >
                {isOpen ? (
                    <X className="h-6 w-6" />
                ) : (
                    <MessageCircle className="h-6 w-6" />
                )}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl z-40 flex flex-col">
                    <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <Bot className="h-6 w-6" />
                            <div>
                                <h3 className="font-bold">Menu Assistant</h3>
                                <p className="text-xs opacity-90">
                                    Ask me anything about our menu!
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${
                                    message.sender === 'user'
                                        ? 'justify-end'
                                        : 'justify-start'
                                }`}
                            >
                                <div
                                    className={`flex gap-3 max-w-[80%] ${
                                        message.sender === 'user'
                                            ? 'flex-row-reverse'
                                            : ''
                                    }`}
                                >
                                    <div
                                        className={`p-2 rounded-full ${
                                            message.sender === 'user'
                                                ? 'bg-indigo-100'
                                                : 'bg-purple-100'
                                        }`}
                                    >
                                        {message.sender === 'user' ? (
                                            <User className="h-4 w-4 text-indigo-600" />
                                        ) : (
                                            <Bot className="h-4 w-4 text-purple-600" />
                                        )}
                                    </div>
                                    <div
                                        className={`px-4 py-2 rounded-lg ${
                                            message.sender === 'user'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-900'
                                        }`}
                                    >
                                        <p className="text-sm">
                                            {message.text}
                                        </p>
                                        <p className="text-xs opacity-70 mt-1">
                                            {message.timestamp.toLocaleTimeString(
                                                [],
                                                {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                }
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="p-2 rounded-full bg-purple-100">
                                    <Bot className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="px-4 py-2 rounded-lg bg-gray-100">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) =>
                                    e.key === 'Enter' && handleSend()
                                }
                                placeholder="Type your question..."
                                className="flex-1 px-4 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
