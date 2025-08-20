import { ApiResponse } from '@/types/api';

class ClientApiService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = '/api';
    }

    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || `HTTP ${response.status}`,
                };
            }

            return {
                success: true,
                data,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    // Generic CRUD methods
    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(endpoint);
    }

    async getById<T>(endpoint: string, id: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`${endpoint}/${id}`);
    }

    async create<T>(
        endpoint: string,
        data: Partial<T>
    ): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async update<T>(
        endpoint: string,
        id: string,
        data: Partial<T>
    ): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`${endpoint}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint: string, id: string): Promise<ApiResponse<void>> {
        return this.makeRequest<void>(`${endpoint}/${id}`, {
            method: 'DELETE',
        });
    }
}

export const clientApiService = new ClientApiService();
