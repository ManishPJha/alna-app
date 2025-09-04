import { db } from '@/lib/db';
import { createServiceContext } from '@/utils/service-utils';

const { log } = createServiceContext('validateSession');

export async function validateSession(sessionToken: string): Promise<boolean> {
    try {
        // Use the API-based approach since direct NextAuth validation is problematic in middleware
        return await validateSessionViaAPI(sessionToken);
    } catch (error) {
        log.error('validateSession error', error);
        return false;
    }
}

/**
 * Validate session by making an internal API call
 * This is the most reliable approach for middleware
 */
async function validateSessionViaAPI(sessionToken: string): Promise<boolean> {
    try {
        // Create a proper URL for the internal API call
        // Use the host from the environment or default to localhost
        const host = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';

        const url = new URL('/api/session/validate', host);

        // Create a proper request with the session cookie
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                Cookie: `authjs.session-token=${sessionToken}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (response.ok) {
            const data = await response.json();
            return data.valid === true;
        }

        console.log('API validation failed with status:', response.status);
        return false;
    } catch (error) {
        console.error('validateSessionViaAPI error:', error);
        return false;
    }
}

/**
 * Alternative: Simple database check if we can extract user ID from the token
 * This is a fallback for when the API approach doesn't work
 */
export async function validateSessionViaDatabaseLookup(
    sessionToken: string
): Promise<boolean> {
    try {
        // Try to extract the user ID from the JWT without full decryption
        // This is a best-effort approach

        // The JWT format is: header.encrypted_key.iv.ciphertext.tag
        const parts = sessionToken.split('.');
        if (parts.length !== 5) {
            return false;
        }

        // For encrypted JWTs, we can't easily extract the payload without the decryption key
        // So we'll use a different approach: check if any user has this session token
        // in their account (if you're storing session tokens in the database)

        // This approach requires you to store session tokens in the database
        const user = await db.user.findFirst({
            where: {
                sessions: {
                    some: {
                        sessionToken: sessionToken,
                    },
                },
            },
            select: { id: true, isActive: true },
        });

        return !!user && user.isActive;
    } catch (error) {
        console.error('validateSessionViaDatabaseLookup error:', error);
        return false;
    }
}
