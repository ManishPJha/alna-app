'use client';

import AppImage from '@/shared/components/ui/image';
import { SignInActionPayload } from '@/types/actions';
import { createServiceContext } from '@/utils/service-utils';
import { Eye, EyeOff, Lock, Mail, Utensils } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

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
            email: payload.email,
            password: payload.password,
            redirect: false,
        });

        if (result?.error) {
            log.error('signInAction error -', result.error);
            setError(result.error);
            handleError('signInAction', result.error, {
                customMessage: 'Error signing in user',
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

            if (!result?.error) {
                toast.success('Login successful!');
                // optional: redirect manually with router.push('/')
                router.push('/dashboard');
                // setTimeout(() => {
                //     redirect('/dashboard');
                // }, 1000);
            }
        } catch (error) {
            setError('Something went wrong. Please try again.');
            if (error instanceof Error) {
                toast.error(error.message);
            }
            handleError('signInAction', error, {
                customMessage: 'Error signing in user',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="relative w-full max-w-md">
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-indigo-200/50 p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-full mb-6 shadow-lg relative">
                            <AppImage
                                src="/alna_assistant.png"
                                alt="Avatar"
                                width={200}
                                height={200}
                                rounded
                            />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent mb-2">
                            Admin Login
                        </h1>
                        <p className="text-gray-600">
                            Enter your credentials to login
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 animate-shake">
                            <p className="text-red-700 text-sm text-center font-medium">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* ✅ Form wrapper prevents refresh */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label
                                htmlFor="signin-email"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Email Address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    id="signin-email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl"
                                    placeholder="chef@restaurant.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="signin-password"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="signin-password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl"
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
                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold py-4 px-6 rounded-xl disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                                    Logging In...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <Utensils className="w-5 h-5 mr-2" />
                                    Login
                                </div>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
