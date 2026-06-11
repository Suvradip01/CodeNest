const User = require('../models/User');
const { sanitizeUser, verifyToken } = require('../services/auth.services');

// In-memory auth cache: token -> { user, expiresAt }
// Avoids a MongoDB Atlas round-trip on every authenticated request.
const AUTH_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const authCache = new Map();

function getCachedUser(token) {
  const entry = authCache.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    authCache.delete(token);
    return null;
  }
  return entry.user;
}

function setCachedUser(token, user) {
  // Prune stale entries when cache grows large
  if (authCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of authCache.entries()) {
      if (now > v.expiresAt) authCache.delete(k);
    }
  }
  authCache.set(token, { user, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });
}

function invalidateAuthCache(token) {
  if (token) authCache.delete(token);
}

function isAuthRequired() {
  return process.env.AUTH_REQUIRED !== 'false';
}

function getBearerToken(req) {
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) return token;
  return null;
}

async function hydrateUserFromToken(token) {
  // Fast path: return cached user without hitting MongoDB
  const cached = getCachedUser(token);
  if (cached) return cached;

  // Slow path: verify JWT then fetch from MongoDB Atlas
  const payload = verifyToken(token);
  const user = await User.findById(payload.sub).select('_id email name createdAt');
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 401;
    throw err;
  }

  const sanitized = sanitizeUser(user);
  setCachedUser(token, sanitized);
  return sanitized;
}

async function optionalAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return next();

  try {
    req.user = await hydrateUserFromToken(token);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    req.user = await hydrateUserFromToken(token);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAuthIfConfigured(req, res, next) {
  if (isAuthRequired()) {
    return requireAuth(req, res, next);
  }

  return optionalAuth(req, res, next);
}

module.exports = {
  isAuthRequired,
  optionalAuth,
  requireAuth,
  requireAuthIfConfigured,
  invalidateAuthCache,
};
