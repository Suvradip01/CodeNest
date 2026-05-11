/**
 * Redis client singleton.
 * Falls back gracefully (no-op) when REDIS_URL is not set or Redis is unreachable,
 * so the app keeps running without caching in development.
 */
const { createClient } = require('redis');

let client = null;
let connected = false;

async function getClient() {
    if (client) return client;

    const url = process.env.REDIS_URL;
    if (!url) {
        console.warn('[Redis] REDIS_URL not set — caching and Redis rate-limiting disabled.');
        return null;
    }

    client = createClient({ url });

    client.on('error', (err) => {
        console.error('[Redis] Connection error:', err.message);
        connected = false;
    });

    client.on('ready', () => {
        console.log('[Redis] Connected and ready.');
        connected = true;
    });

    try {
        await client.connect();
        connected = true;
    } catch (err) {
        console.error('[Redis] Failed to connect:', err.message);
        client = null;
        connected = false;
    }

    return client;
}

/**
 * Safe GET — returns null on any error.
 */
async function cacheGet(key) {
    try {
        const c = await getClient();
        if (!c || !connected) return null;
        const raw = await c.get(key);
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        console.error('[Redis] cacheGet error:', err.message);
        return null;
    }
}

/**
 * Safe SET with optional TTL in seconds (default: 60s).
 */
async function cacheSet(key, value, ttlSeconds = 60) {
    try {
        const c = await getClient();
        if (!c || !connected) return;
        await c.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (err) {
        console.error('[Redis] cacheSet error:', err.message);
    }
}

/**
 * Safe DEL — delete one or more keys.
 */
async function cacheDel(...keys) {
    try {
        const c = await getClient();
        if (!c || !connected || !keys.length) return;
        await c.del(keys);
    } catch (err) {
        console.error('[Redis] cacheDel error:', err.message);
    }
}

/**
 * Atomically increment a counter and set TTL on first touch.
 * Used for Redis-backed rate limiting.
 * Returns the new counter value, or null on failure.
 */
async function rateLimitIncr(key, windowSeconds) {
    try {
        const c = await getClient();
        if (!c || !connected) return null;
        const count = await c.incr(key);
        if (count === 1) {
            // First hit in this window — set expiry
            await c.expire(key, windowSeconds);
        }
        return count;
    } catch (err) {
        console.error('[Redis] rateLimitIncr error:', err.message);
        return null;
    }
}

/**
 * Get remaining TTL for a key in seconds. Returns null on failure.
 */
async function keyTTL(key) {
    try {
        const c = await getClient();
        if (!c || !connected) return null;
        return await c.ttl(key);
    } catch (err) {
        return null;
    }
}

module.exports = { getClient, cacheGet, cacheSet, cacheDel, rateLimitIncr, keyTTL };
