'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Restaurant page error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="p-4 bg-red-50 rounded-full mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong!
            </h2>
            <p className="text-gray-600 mb-6 max-w-md">
                {error.message ||
                    'Failed to load restaurant details. Please try again.'}
            </p>
            <div className="flex gap-4">
                <Button onClick={reset} variant="outline">
                    Try again
                </Button>
                <Button onClick={() => window.history.back()}>Go back</Button>
            </div>
        </div>
    );
}
