const express = require('express');
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);
router.post('/update-password', authController.updatePassword);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
