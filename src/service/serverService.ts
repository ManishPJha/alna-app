/* eslint-disable @typescript-eslint/no-explicit-any */

import { cookies, headers } from 'next/headers';

import { createServiceContext } from '@/utils/service-utils';

const { log, handleError } = createServiceContext('ServerService');

const getBaseURL = async () => {
    const headersList = await headers();
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const host = headersList.get('host');
    return `${protocol}://${host}/api`;
};

// Generic API function with automatic retry
async function apiCall<T>(
    path: string,
    config: RequestInit,
    params?: string,
    retryCount = 0
): Promise<T> {
    try {
        const baseURL = await getBaseURL();
        const response = await fetch(
            params ? `${baseURL}/${path}/${params}` : `${baseURL}/${path}`,
            config
        );
        return response.json();
    } catch (error: any) {
        log.error('ServerService', 'apiCall', 'Failed to make API call', {
            path,
            params,
            retryCount,
            error,
        });
        // If it's a 401 and we haven't retried yet, the interceptor should handle it
        // But if it still fails after retry, we need to handle it here
        if (error.response?.status === 401 && retryCount === 0) {
            // Wait a bit and retry once more
            await new Promise((resolve) => setTimeout(resolve, 100));
            return apiCall<T>(path, config, params, retryCount + 1);
        }

        return handleError('ServerService', 'apiCall', error);
    }
}

export async function getRequest(path: string) {
    const cookieStore = await cookies();
    return apiCall(`${path}`, {
        cache: 'no-store',
        headers: { Cookie: cookieStore.toString() },
    });
}

export async function getRequestWithRevalidate(
    path: string,
    revalidate: number
) {
    const cookieStore = await cookies();
    return apiCall(`${path}`, {
        next: { revalidate },
        headers: { Cookie: cookieStore.toString() },
    });
}

export async function getApiWithParam(path: string, param: string) {
    const cookieStore = await cookies();
    return apiCall(`${path}/${param}`, {
        next: { revalidate: 3600 },
        headers: { Cookie: cookieStore.toString() },
    });
}

export async function postRequest(path: string, data: any) {
    const cookieStore = await cookies();
    return apiCall(`${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Cookie: cookieStore.toString(),
        },
        body: JSON.stringify(data),
    });
}

export async function postRequestWithFormData(
    path: string,
    formData: FormData
): Promise<any> {
    const cookieStore = await cookies();
    return apiCall(`${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data',
            Cookie: cookieStore.toString(),
        },
        body: formData,
    });
}

export async function deleteRequest(path: string) {
    const cookieStore = await cookies();
    return apiCall(`${path}`, {
        method: 'DELETE',
        headers: {
            Cookie: cookieStore.toString(),
        },
    });
}

export async function updateRequest(path: string, data: any) {
    const cookieStore = await cookies();
    return apiCall(`${path}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Cookie: cookieStore.toString(),
        },
        body: JSON.stringify(data),
    });
}
