const { loginUser, registerUser } = require('../services/auth.services');

// 7 days in seconds by default
const TOKEN_TTL_SECONDS = Number(process.env.JWT_TTL_SECONDS || 60 * 60 * 24 * 7);

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Lax is perfect for local development
  maxAge: TOKEN_TTL_SECONDS * 1000 // maxAge is in milliseconds
});

exports.register = async (req, res) => {
  try {
    const session = await registerUser(req.body || {});
    res.cookie('token', session.token, getCookieOptions());
    res.status(201).json(session);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const session = await loginUser(req.body || {});
    res.cookie('token', session.token, getCookieOptions());
    res.json(session);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Login failed' });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};
