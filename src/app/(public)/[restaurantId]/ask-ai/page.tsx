'use client';

import { Loader2, Send, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type PageProps = {
    params: { restaurantId: string };
};

const AskAiByRestaurantPage = ({ params }: PageProps) => {
    const [restaurantId, setRestaurantId] = useState('');
    const [messages, setMessages] = useState<
        { role: 'user' | 'ai'; text: string }[]
    >([]);
    const [input, setInput] = useState('');
    const [includeFaq, setIncludeFaq] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setRestaurantId(params.restaurantId ?? '');
    }, [params.restaurantId]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Add user message
        setMessages((prev) => [...prev, { role: 'user', text: input }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/ask-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantId,
                    question: input,
                    includeFaq,
                }),
            });
            const data = await res.json();
            const answer =
                data.answer ?? '⚠️ Sorry, I could not find an answer.';

            // Add AI response
            setMessages((prev) => [...prev, { role: 'ai', text: answer }]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'ai',
                    text: '⚠️ Something went wrong. Please try again.',
                },
            ]);
        } finally {
            setInput('');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
            <div className="w-full max-w-md h-[80vh] bg-gray-900 text-white rounded-xl shadow-lg flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div>
                        <h2 className="text-lg font-semibold">
                            Ask about the menu
                        </h2>
                        <p className="text-xs text-gray-400">
                            Restaurant ID:{' '}
                            <span className="font-mono">{restaurantId}</span>
                        </p>
                    </div>
                    <button className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Chat area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 text-sm mt-10">
                            Example:{' '}
                            <span className="italic">
                                &quot;What are today’s specials?&quot;
                            </span>{' '}
                            or{' '}
                            <span className="italic">
                                &quot;Show me vegan options.&quot;
                            </span>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                msg.role === 'user'
                                    ? 'ml-auto bg-indigo-600 text-white'
                                    : 'mr-auto bg-gray-800 text-gray-200'
                            }`}
                        >
                            {msg.text}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="mr-auto bg-gray-800 text-gray-300 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Thinking…
                        </div>
                    )}
                </div>

                {/* Input */}
                <form
                    onSubmit={sendMessage}
                    className="p-4 border-t border-gray-800 flex items-center gap-2"
                >
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        rows={1}
                        placeholder="Type your question..."
                        className="flex-1 resize-none rounded-lg bg-gray-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="rounded-lg bg-indigo-500 hover:bg-indigo-600 p-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </form>

                {/* FAQ Toggle */}
                <div className="flex items-center gap-2 px-4 pb-4 text-xs text-gray-400">
                    <input
                        id="includeFaq"
                        type="checkbox"
                        checked={includeFaq}
                        onChange={(e) => setIncludeFaq(e.target.checked)}
                        className="h-3 w-3 text-indigo-500 bg-gray-800 border-gray-700 rounded"
                    />
                    <label htmlFor="includeFaq">Include FAQ in answers</label>
                </div>
            </div>
        </div>
    );
};

export default AskAiByRestaurantPage;
