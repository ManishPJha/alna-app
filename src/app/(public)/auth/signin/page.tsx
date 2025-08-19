'use client';

import { paths } from '@/config/routes';
import { SignInActionPayload } from '@/types/actions';
import { createServiceContext } from '@/utils/service-utils';
import { Eye, EyeOff, Lock, Mail, Utensils } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const { log, handleError } = createServiceContext('signInAction');

    const signInAction = async (payload: SignInActionPayload) => {
        const result = await signIn('credentials', {
            redirect: false,
            email: payload.email,
            password: payload.password,
        });

        console.log('signInAction result -', result);

        if (result?.error) {
            log.error('signInAction error -', result.error);
            return handleError('signInAction', result.error, {
                customMessage: 'Error signing in user',
                rethrow: true,
            });
        }

        return result;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await signInAction({ email, password });

            if (result?.error) {
                setError(result.error);
            } else {
                // router.push(paths.homePage);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const onSwitchToSignUp = () => router.push(paths.signUp);

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background food pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-20 left-20 text-6xl">🍽️</div>
                <div className="absolute top-40 right-32 text-4xl">🥘</div>
                <div className="absolute bottom-32 left-16 text-5xl">🍷</div>
                <div className="absolute bottom-20 right-20 text-3xl">🥗</div>
                <div className="absolute top-60 left-1/2 text-4xl">🍕</div>
                <div className="absolute bottom-60 right-1/3 text-5xl">🍝</div>
            </div>

            {/* Floating food elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-orange-400 rounded-full animate-ping opacity-20"></div>
                <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-red-400 rounded-full animate-pulse opacity-30"></div>
                <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-yellow-400 rounded-full animate-bounce opacity-25"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Main card with restaurant ambiance */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-orange-200/50 p-8 transform transition-all duration-500 hover:shadow-3xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-6 shadow-lg relative">
                            <Utensils className="w-10 h-10 text-white" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-orange-800 rounded-full"></div>
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-gray-600">Your table is ready</p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 animate-shake">
                            <p className="text-red-700 text-sm text-center font-medium">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Form */}
                    <div className="space-y-6">
                        {/* Email field */}
                        <div className="space-y-2">
                            <label
                                htmlFor="signin-email"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Email Address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-orange-400 group-focus-within:text-orange-600 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    id="signin-email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-orange-400 transition-all duration-200 hover:border-orange-300"
                                    placeholder="chef@restaurant.com"
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div className="space-y-2">
                            <label
                                htmlFor="signin-password"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-orange-400 group-focus-within:text-orange-600 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="signin-password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-orange-400 transition-all duration-200 hover:border-orange-300"
                                    placeholder="Your secret recipe"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-orange-600 transition-colors" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400 hover:text-orange-600 transition-colors" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit button */}
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                                    Entering Kitchen...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <Utensils className="w-5 h-5 mr-2" />
                                    Enter Restaurant
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-600">
                            New to our restaurant?{' '}
                            <button
                                onClick={onSwitchToSignUp}
                                className="text-orange-600 hover:text-orange-700 font-semibold transition-colors duration-200 hover:underline"
                            >
                                Reserve Your Spot
                            </button>
                        </p>
                    </div>
                </div>

                {/* Decorative food elements */}
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-20 blur-sm"></div>
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-r from-red-400 to-orange-400 rounded-full opacity-20 blur-sm"></div>
            </div>
        </div>
    );
}
