const { loginUser, registerUser, generateResetToken, resetPasswordWithToken } = require('../services/auth.services');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

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
        if (process.env.RESEND_API_KEY) {
          await resend.emails.send({
            from: 'CodeNest Security <onboarding@resend.dev>', // Resend testing domain
            to: email,
            subject: 'CodeNest - Password Reset Request',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Password Reset</h2>
                <p>You requested a password reset for your CodeNest account.</p>
                <p>Please click the button below to set a new password. This link will expire in 1 hour.</p>
                <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Reset Password</a>
                <p style="font-size: 12px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
              </div>
            `
          });
          console.log(`[RESEND SENT] Password Reset sent to ${email}`);
        } else {
          console.warn('[RESEND SKIPPED] No RESEND_API_KEY found in .env. Reset Link:', resetLink);
        }
      } catch (emailError) {
        console.error('[RESEND ERROR] Failed to send email:', emailError);
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