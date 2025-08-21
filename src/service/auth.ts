import { User } from '@/types/api';
import { apiClient } from './api-client';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
}

export interface AuthResponse {
    user: User;
    message?: string;
}

export const authService = {
    // Register new user
    register: (data: RegisterData) =>
        apiClient.post<AuthResponse>('/auth/register', data),

    // Verify email
    verifyEmail: (token: string) =>
        apiClient.post<{ message: string }>('/auth/verify-email', { token }),

    // Request password reset
    forgotPassword: (email: string) =>
        apiClient.post<{ message: string }>('/auth/forgot-password', { email }),

    // Reset password with token
    resetPassword: (token: string, password: string) =>
        apiClient.post<{ message: string }>('/auth/reset-password', {
            token,
            password,
        }),

    // Check if email exists
    checkEmail: (email: string) =>
        apiClient.post<{ exists: boolean }>('/auth/check-email', { email }),

    // Refresh session (validate current user)
    refreshSession: () => apiClient.get<User>('/auth/session'),
};
