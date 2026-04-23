const crypto = require('crypto');
const User = require('../models/User');

const TOKEN_TTL_SECONDS = Number(process.env.JWT_TTL_SECONDS || 60 * 60 * 24 * 7);
const TOKEN_SECRET = process.env.JWT_SECRET || 'development-only-secret-change-me';
const EMAIL_REGEX = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;

function toBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signHmac(value) {
  return crypto.createHmac('sha256', TOKEN_SECRET).update(value).digest('base64url');
}

function signToken(payload) {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify(payload));
  const signature = signHmac(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  const [header, body, signature] = String(token || '').split('.');
  if (!header || !body || !signature) {
    const err = new Error('Malformed token');
    err.statusCode = 401;
    throw err;
  }

  const expected = signHmac(`${header}.${body}`);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    const err = new Error('Invalid token signature');
    err.statusCode = 401;
    throw err;
  }

  const payload = JSON.parse(fromBase64Url(body));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    const err = new Error('Token expired');
    err.statusCode = 401;
    throw err;
  }

  return payload;
}

function scryptAsync(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

async function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = await scryptAsync(password, salt);
  return `${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, expectedHex] = String(storedHash || '').split(':');
  if (!salt || !expectedHex) return false;

  const actual = await scryptAsync(password, salt);
  const actualBuffer = Buffer.from(actual.toString('hex'), 'hex');
  const expectedBuffer = Buffer.from(expectedHex, 'hex');

  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name || '',
    createdAt: user.createdAt
  };
}

function validateCredentials(email, password) {
  const normalizedEmail = normalizeEmail(email);
  if (
    !normalizedEmail ||
    normalizedEmail.length > 254 ||
    !EMAIL_REGEX.test(normalizedEmail) ||
    normalizedEmail.includes('..')
  ) {
    const err = new Error('A valid email address is required');
    err.statusCode = 400;
    throw err;
  }

  if (typeof password !== 'string' || password.length < 8) {
    const err = new Error('Password must be at least 8 characters long');
    err.statusCode = 400;
    throw err;
  }

  return normalizedEmail;
}

function createSession(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS
  };

  return {
    token: signToken(payload),
    user: sanitizeUser(user)
  };
}

async function registerUser({ email, password, name }) {
  const normalizedEmail = validateCredentials(email, password);
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email: normalizedEmail,
    name: String(name || '').trim(),
    passwordHash
  });

  return createSession(user);
}

async function loginUser({ email, password }) {
  const normalizedEmail = validateCredentials(email, password);
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  return createSession(user);
}

module.exports = {
  loginUser,
  registerUser,
  sanitizeUser,
  verifyToken
};
