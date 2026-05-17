const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { requireAuthIfConfigured } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { ensureTextPayloadWithinLimit } = require('../middleware/payload');

const MAX_CODE_BYTES = Number(process.env.MAX_CODE_BYTES || 64 * 1024);
const MAX_PROMPT_BYTES = Number(process.env.MAX_PROMPT_BYTES || 8 * 1024);
const MAX_ERROR_OUTPUT_BYTES = Number(process.env.MAX_ERROR_OUTPUT_BYTES || 32 * 1024);

// Apply common middleware
router.use(requireAuthIfConfigured, aiLimiter);

router.post('/get-review', ensureTextPayloadWithinLimit('code', MAX_CODE_BYTES), aiController.getReview);
router.post('/edit-code', ensureTextPayloadWithinLimit('prompt', MAX_PROMPT_BYTES), ensureTextPayloadWithinLimit('code', MAX_CODE_BYTES), aiController.editCode);
router.post('/live-check', ensureTextPayloadWithinLimit('code', MAX_CODE_BYTES), aiController.liveCheck);
router.post('/explain-diff', ensureTextPayloadWithinLimit('oldCode', MAX_CODE_BYTES), ensureTextPayloadWithinLimit('newCode', MAX_CODE_BYTES), aiController.explainDiff);
router.post('/debug-fix', ensureTextPayloadWithinLimit('code', MAX_CODE_BYTES), ensureTextPayloadWithinLimit('errorOutput', MAX_ERROR_OUTPUT_BYTES), aiController.debugFix);
router.post('/visualize', ensureTextPayloadWithinLimit('code', MAX_CODE_BYTES), aiController.visualizeCode);

module.exports = router;
