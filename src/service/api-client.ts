import { ApiResponse } from '@/types/api';

export class ApiError extends Error {
    constructor(message: string, public status?: number, public code?: string) {
        super(message);
        this.name = 'ApiError';
    }
}

class ApiClient {
    private baseUrl = '/api';

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        // try {
        const url = `${this.baseUrl}${endpoint}`;

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(
                data.error || `HTTP ${response.status}: ${response.statusText}`,
                response.status,
                data.code
            );
        }

        return {
            success: true,
            data,
            message: data.message,
        };
        // } catch (error) {
        //     console.error(`API Error [${endpoint}]:`, error);

        //     if (error instanceof ApiError) {
        //         return {
        //             success: false,
        //             error: error.message,
        //             status: error.status,
        //         };
        //     }

        //     return {
        //         success: false,
        //         error:
        //             error instanceof Error
        //                 ? error.message
        //                 : 'Network error occurred',
        //     };
        // }
    }

    async get<T>(endpoint: string, params?: Record<string, string>) {
        const url = params
            ? `${endpoint}?${new URLSearchParams(params)}`
            : endpoint;
        return this.request<T>(url);
    }

    async getBlob(endpoint: string, params?: Record<string, string>): Promise<Blob> {
        const url = params
            ? `${this.baseUrl}${endpoint}?${new URLSearchParams(params)}`
            : `${this.baseUrl}${endpoint}`;
            
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new ApiError(
                error.message || `HTTP ${response.status}: ${response.statusText}`,
                response.status,
                error.code
            );
        }

        return await response.blob();
    }

    async post<T>(endpoint: string, data: unknown) {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put<T>(endpoint: string, data: unknown) {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async patch<T>(endpoint: string, data: unknown) {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async delete<T>(endpoint: string) {
        return this.request<T>(endpoint, {
            method: 'DELETE',
        });
    }

    // File upload method
    async upload<T>(
        endpoint: string,
        file: File,
        additionalData?: Record<string, string>
    ) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            if (additionalData) {
                Object.entries(additionalData).forEach(([key, value]) => {
                    formData.append(key, value);
                });
            }

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new ApiError(
                    data.error || `Upload failed: ${response.statusText}`,
                    response.status
                );
            }

            return {
                success: true,
                data: data.data || data,
            } as ApiResponse<T>;
        } catch (error) {
            console.error(`Upload Error [${endpoint}]:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Upload failed',
            };
        }
    }
}

export const apiClient = new ApiClient();
