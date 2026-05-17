const express = require('express');
const router = express.Router();
const codeController = require('../controllers/code.controller');
const { requireAuthIfConfigured } = require('../middleware/auth');
const { executionLimiter } = require('../middleware/rateLimiter');
const { ensureTextPayloadWithinLimit } = require('../middleware/payload');

const MAX_CODE_BYTES = Number(process.env.MAX_CODE_BYTES || 64 * 1024);

router.post('/run', requireAuthIfConfigured, executionLimiter, ensureTextPayloadWithinLimit('code', MAX_CODE_BYTES), codeController.runCode);

module.exports = router;
