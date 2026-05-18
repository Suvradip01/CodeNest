const { loginUser, registerUser, generateResetToken, resetPasswordWithToken, sendPasswordResetEmail } = require('../services/auth.services');

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

exports.resetPassword = async (req, res) => {
  console.log(`\n[DEBUG] Backend received reset request for: ${req.body?.email}`);
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate secure token (returns null if user doesn't exist)
    const token = await generateResetToken(email);

    if (token) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetLink = `${frontendUrl.replace(/\/+$/, '')}/?resetToken=${token}`;

      try {
        await sendPasswordResetEmail(email, resetLink);
      } catch (emailError) {
        // Errors are logged in the service layer, but we catch them here so it doesn't crash the request
      }
    } else {
      // Simulate delay for consistent response time (anti-enumeration)
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    res.json({ success: true, message: 'If an account with that email exists, reset instructions have been sent.' });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Failed to process reset request' });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    await resetPasswordWithToken(token, password);
    res.json({ success: true, message: 'Password has been successfully reset. You can now login.' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update password' });
  }
};