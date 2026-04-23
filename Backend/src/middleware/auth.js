const User = require('../models/User');
const { sanitizeUser, verifyToken } = require('../services/auth.services');

function isAuthRequired() {
  return process.env.AUTH_REQUIRED !== 'false';
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

async function hydrateUserFromToken(token) {
  const payload = verifyToken(token);
  const user = await User.findById(payload.sub).select('_id email name createdAt');
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 401;
    throw err;
  }

  return sanitizeUser(user);
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
  requireAuthIfConfigured
};
