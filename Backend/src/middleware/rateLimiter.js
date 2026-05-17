const { rateLimitIncr, keyTTL } = require('../cache/redis');

function getClientKey(req) {
    return req.user?.id || req.ip || req.socket?.remoteAddress || 'unknown';
}

const inMemoryHits = new Map();

function createRateLimiter({ name, windowMs, maxRequests }) {
    const windowSeconds = Math.ceil(windowMs / 1000);

    return async (req, res, next) => {
        const clientKey = getClientKey(req);
        const redisKey = `rl:${name}:${clientKey}`;

        // --- Try Redis-backed rate limiting first ---
        const redisCount = await rateLimitIncr(redisKey, windowSeconds);

        if (redisCount !== null) {
            // Redis is available
            if (redisCount > maxRequests) {
                const ttl = (await keyTTL(redisKey)) ?? 1;
                res.setHeader('Retry-After', String(Math.max(ttl, 1)));
                return res.status(429).json({ error: `Rate limit exceeded for ${name}` });
            }
            return next();
        }

        // --- Fallback: in-memory rate limiting ---
        const now = Date.now();
        const key = `${name}:${clientKey}`;
        const recent = (inMemoryHits.get(key) || []).filter(t => now - t < windowMs);

        // Prune stale keys every 5000 entries
        if (inMemoryHits.size > 5000) {
            for (const [k, timestamps] of inMemoryHits.entries()) {
                const latest = timestamps[timestamps.length - 1];
                if (!latest || now - latest >= windowMs) inMemoryHits.delete(k);
            }
        }

        if (recent.length >= maxRequests) {
            const retryAfterSeconds = Math.ceil((windowMs - (now - recent[0])) / 1000);
            res.setHeader('Retry-After', String(Math.max(retryAfterSeconds, 1)));
            return res.status(429).json({ error: `Rate limit exceeded for ${name}` });
        }

        recent.push(now);
        inMemoryHits.set(key, recent);
        next();
    };
}

const aiLimiter = createRateLimiter({
    name: 'ai',
    windowMs: Number(process.env.AI_RATE_WINDOW_MS || 60 * 1000),
    maxRequests: Number(process.env.AI_RATE_LIMIT || 20)
});

const executionLimiter = createRateLimiter({
    name: 'execution',
    windowMs: Number(process.env.EXEC_RATE_WINDOW_MS || 60 * 1000),
    maxRequests: Number(process.env.EXEC_RATE_LIMIT || 10)
});

const projectLimiter = createRateLimiter({
    name: 'projects',
    windowMs: Number(process.env.PROJECT_RATE_WINDOW_MS || 60 * 1000),
    maxRequests: Number(process.env.PROJECT_RATE_LIMIT || 60)
});

module.exports = {
    createRateLimiter,
    aiLimiter,
    executionLimiter,
    projectLimiter
};
