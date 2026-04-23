const express = require('express');
const { loginUser, registerUser } = require('../services/auth.services');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const session = await registerUser(req.body || {});
    res.status(201).json(session);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const session = await loginUser(req.body || {});
    res.json(session);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Login failed' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
