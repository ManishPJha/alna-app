/* eslint-disable @typescript-eslint/no-explicit-any */
import { headers } from 'next/headers';

import { createServiceContext } from '@/utils/service-utils';

const { log, handleError } = createServiceContext('ViewService');

const getBaseURL = async () => {
    const headersList = await headers();
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const host = headersList.get('host');
    return `${protocol}://${host}/api`;
};

const baseURL = await getBaseURL();

// Generic API function with automatic retry
async function apiCall<T>(
    path: string,
    config: RequestInit,
    params?: string,
    retryCount = 0
): Promise<T> {
    try {
        log.info('ViewService', 'apiCall', 'Making API call', {
            path,
            params,
            retryCount,
        });

        const response = await fetch(
            params ? `${baseURL}/${path}/${params}` : `${baseURL}/${path}`,
            config
        );
        return response.json();
    } catch (error: any) {
        log.error('ViewService', 'apiCall', 'Failed to make API call', {
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

        return handleError('ViewService', 'apiCall', error);
    }
}

export async function getRequest(path: string) {
    return apiCall(path, { next: { revalidate: 3600 } });
}

export async function getApiWithParam(path: string, param: string) {
    return apiCall(path, { next: { revalidate: 3600 } }, param);
}

export async function postRequest(path: string, data: any) {
    return apiCall(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
}

export async function deleteRequest(path: string) {
    return apiCall(path, { method: 'DELETE' });
}

export async function updateRequest(path: string, data: any) {
    return apiCall(path, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
}

export async function patchUpdateRequest(path: string, data: any) {
    return apiCall(path, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
}

export async function getApiResponce(path: string, apikey: any) {
    return apiCall(path, {
        method: 'GET',
        headers: {
            'X-Api-Key': `${apikey}`,
            'Content-Type': 'application/json',
        },
    });
}
