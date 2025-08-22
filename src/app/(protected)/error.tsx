'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        console.error('Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Error Card with Theme */}
                <Card className="bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden">
                    <CardHeader className="bg-red-50 border-b border-red-100 text-center p-8">
                        <div className="mx-auto bg-red-100 p-4 rounded-2xl w-fit mb-6">
                            <AlertTriangle className="h-12 w-12 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-red-700 mb-2">
                            Something went wrong!
                        </CardTitle>
                        <p className="text-red-600 text-sm">
                            We encountered an unexpected error
                        </p>
                    </CardHeader>

                    <CardContent className="p-8 space-y-6 bg-white">
                        <p className="text-gray-600 text-center leading-relaxed">
                            We encountered an error while loading your page.
                            This might be a temporary issue. Please try
                            refreshing the page or return to the dashboard.
                        </p>

                        {/* Development Error Details */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                                <h4 className="text-sm font-semibold text-red-800 mb-2">
                                    Development Error Details:
                                </h4>
                                <p className="text-sm font-mono text-red-700 break-words leading-relaxed">
                                    {error.message}
                                </p>
                                {error.digest && (
                                    <p className="text-xs text-red-600 mt-2">
                                        Error ID: {error.digest}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button
                                onClick={reset}
                                type="button"
                                className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 rounded-xl"
                                size="lg"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => router.push('/dashboard')}
                                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 rounded-xl"
                                size="lg"
                            >
                                <Home className="h-4 w-4 mr-2" />
                                Go to Dashboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Help Text */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        If the problem persists, please contact support or try
                        again later.
                    </p>
                </div>
            </div>
        </div>
    );
}
