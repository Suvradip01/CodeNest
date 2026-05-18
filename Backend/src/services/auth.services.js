const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

// --- CONFIGURATION ---
const TOKEN_TTL_SECONDS = Number(process.env.JWT_TTL_SECONDS || 60 * 60 * 24 * 7);
const TOKEN_SECRET = process.env.JWT_SECRET || 'development-only-secret-change-me';
const EMAIL_REGEX = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;


// === 1. VALIDATION & SANITIZATION ===

// Normalize email input to lowercase and trimmed
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// Validate credentials payload format
function validateCredentials(email, password) {
  const normalizedEmail = normalizeEmail(email);

  // Email format validation
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

  // Password length validation
  if (typeof password !== 'string' || password.length < 8) {
    const err = new Error('Password must be at least 8 characters long');
    err.statusCode = 400;
    throw err;
  }

  return normalizedEmail;
}

// Remove sensitive data before sending user object
function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name || '',
    createdAt: user.createdAt
  };
}


// === 2. VERIFICATION & HASHING ===

// Hash password using bcrypt adaptive hashing (10 rounds)
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Compare raw password against secure stored bcrypt hash
async function verifyPassword(password, storedHash) {
  return bcrypt.compare(password, storedHash);
}


// === 3. AUTHENTICATION ===

// Sign JWT payload with expiration and explicit HS256 algorithm
function signToken(payload) {
  return jwt.sign(payload, TOKEN_SECRET, {
    expiresIn: TOKEN_TTL_SECONDS,
    algorithm: 'HS256'
  });
}

// Verify JWT signature and expiration, preventing algorithm confusion attacks
function verifyToken(token) {
  try {
    if (!token) {
      const err = new Error('No token provided');
      err.statusCode = 401;
      throw err;
    }
    return jwt.verify(token, TOKEN_SECRET, {
      algorithms: ['HS256']
    });
  } catch (error) {
    const err = new Error(error.message);
    err.statusCode = 401;
    throw err;
  }
}

// Generate authentication session payload
function createSession(user) {
  const payload = {
    sub: user._id.toString(),
    email: user.email
  };

  return {
    token: signToken(payload),
    user: sanitizeUser(user)
  };
}


// === 4. HIGH-LEVEL WORKFLOWS (ENTRY POINTS) ===

// Register a new user in the system
async function registerUser({ email, password, name }) {
  const normalizedEmail = validateCredentials(email, password);

  // Check if email already registered
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409;
    throw err;
  }

  // Hash password & store user
  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email: normalizedEmail,
    name: String(name || '').trim(),
    passwordHash
  });

  return createSession(user);
}

// Login an existing user
async function loginUser({ email, password }) {
  const normalizedEmail = validateCredentials(email, password);

  // Load user profile
  const user = await User.findOne({ email: normalizedEmail });

  // Verify stored credentials match
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  return createSession(user);
}


// === 4. PASSWORD MANAGEMENT ===

// Generate a secure, time-limited reset token
async function generateResetToken(email) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });
  
  if (!user) {
    // Return null silently to prevent email enumeration
    return null;
  }

  // Generate 40-character hex token
  const token = crypto.randomBytes(20).toString('hex');
  
  // Set token and expiry (1 hour from now)
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();
  
  return token;
}

// Reset password using a valid token
async function resetPasswordWithToken(token, newPassword) {
  if (!token) {
    const err = new Error('Reset token is missing');
    err.statusCode = 400;
    throw err;
  }
  
  // Password length validation
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    const err = new Error('Password must be at least 8 characters long');
    err.statusCode = 400;
    throw err;
  }

  // Find user by valid, unexpired token
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    const err = new Error('Password reset token is invalid or has expired');
    err.statusCode = 400;
    throw err;
  }

  // Hash new password and clear token fields
  user.passwordHash = await hashPassword(newPassword);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  
  return true;
}


// === 5. EXPORTS ===
module.exports = {
  loginUser,
  registerUser,
  sanitizeUser,
  verifyToken,
  generateResetToken,
  resetPasswordWithToken
};