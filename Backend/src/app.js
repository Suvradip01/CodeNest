const crypto = require('crypto');
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const aiRoutes = require('./routes/ai.routes');
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const aiServices = require('./services/ai.services');
const { isAuthRequired, requireAuthIfConfigured } = require('./middleware/auth');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codenest';

if (isAuthRequired() && !process.env.JWT_SECRET) {
    console.warn('JWT_SECRET is not set. Falling back to the development signing secret.');
}

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

const app = express();
const startedAt = Date.now();
const requestMetrics = {
    total: 0,
    byRoute: {},
    byStatus: {}
};

const MAX_CODE_BYTES = Number(process.env.MAX_CODE_BYTES || 64 * 1024);
const MAX_PROMPT_BYTES = Number(process.env.MAX_PROMPT_BYTES || 8 * 1024);
const MAX_ERROR_OUTPUT_BYTES = Number(process.env.MAX_ERROR_OUTPUT_BYTES || 32 * 1024);

function getCorsOrigin() {
    const configured = String(process.env.CORS_ORIGIN || '').trim();
    if (!configured) return true;
    return configured.split(',').map(value => value.trim()).filter(Boolean);
}

function getClientKey(req) {
    return req.user?.id || req.ip || req.socket?.remoteAddress || 'unknown';
}

function createRateLimiter({ name, windowMs, maxRequests }) {
    const hits = new Map();

    return (req, res, next) => {
        const now = Date.now();
        const key = `${name}:${getClientKey(req)}`;
        const recent = (hits.get(key) || []).filter(timestamp => now - timestamp < windowMs);

        if (hits.size > 5000) {
            for (const [storedKey, timestamps] of hits.entries()) {
                const latest = timestamps[timestamps.length - 1];
                if (!latest || now - latest >= windowMs) {
                    hits.delete(storedKey);
                }
            }
        }

        if (recent.length >= maxRequests) {
            const retryAfterSeconds = Math.ceil((windowMs - (now - recent[0])) / 1000);
            res.setHeader('Retry-After', String(Math.max(retryAfterSeconds, 1)));
            return res.status(429).json({ error: `Rate limit exceeded for ${name}` });
        }

        recent.push(now);
        hits.set(key, recent);
        next();
    };
}

function ensureTextPayloadWithinLimit(fieldName, maxBytes) {
    return (req, res, next) => {
        const value = req.body?.[fieldName];
        if (typeof value !== 'string') return next();

        if (Buffer.byteLength(value, 'utf8') > maxBytes) {
            return res.status(413).json({
                error: `${fieldName} exceeds the ${maxBytes} byte limit`
            });
        }

        next();
    };
}

const aiLimiter = createRateLimiter({
    name: 'ai',
    windowMs: Number(process.env.AI_RATE_WINDOW_MS || 60 * 1000),
    maxRequests: Number(process.env.AI_RATE_LIMIT || 20)
});

const executionLimiter = createRateLimiter({
    name: 'execution',
    windowMs: Number(process.env.EXEC_RATE_WINDOW_MS || 60 * 1000),
    maxRequests: Number(process.env.EXEC_RATE_LIMIT || 10)
});

const projectLimiter = createRateLimiter({
    name: 'projects',
    windowMs: Number(process.env.PROJECT_RATE_WINDOW_MS || 60 * 1000),
    maxRequests: Number(process.env.PROJECT_RATE_LIMIT || 60)
});

app.use(cors({ origin: getCorsOrigin() }));
app.use(express.json({ limit: process.env.MAX_JSON_BODY || '256kb' }));

app.use((req, res, next) => {
    req.requestId = crypto.randomUUID();
    req.requestStartedAt = Date.now();
    res.setHeader('X-Request-Id', req.requestId);

    res.on('finish', () => {
        const routeKey = req.route?.path || req.path;
        const statusGroup = `${Math.floor(res.statusCode / 100)}xx`;
        requestMetrics.total += 1;
        requestMetrics.byRoute[routeKey] = (requestMetrics.byRoute[routeKey] || 0) + 1;
        requestMetrics.byStatus[statusGroup] = (requestMetrics.byStatus[statusGroup] || 0) + 1;

        console.log(JSON.stringify({
            type: 'request',
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Date.now() - req.requestStartedAt,
            ip: req.ip
        }));
    });

    next();
});

app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/projects', requireAuthIfConfigured, projectLimiter, projectRoutes);
app.use('/projects', requireAuthIfConfigured, projectLimiter, projectRoutes);

app.post(
    ['/api/ai/get-review', '/ai/get-review'],
    requireAuthIfConfigured,
    aiLimiter,
    ensureTextPayloadWithinLimit('code', MAX_CODE_BYTES),
    aiRoutes.getReview
);

app.post(
    ['/api/ai/edit-code', '/ai/edit-code'],
    requireAuthIfConfigured,
    aiLimiter,
    ensureTextPayloadWithinLimit('prompt', MAX_PROMPT_BYTES),
    ensureTextPayloadWithinLimit('code', MAX_CODE_BYTES),
    aiRoutes.editCode
);

app.post(
    ['/api/ai/live-check', '/ai/live-check'],
    requireAuthIfConfigured,
    aiLimiter,
    ensureTextPayloadWithinLimit('code', MAX_CODE_BYTES),
    async (req, res) => {
        const { code, language } = req.body;
        if (!code || !code.trim()) return res.json({ warnings: [], suggestions: [], complexity: 'Simple' });
        try {
            const result = await aiServices.liveCheck(code, language || 'javascript');
            res.json(result);
        } catch (err) {
            console.error('Live check error:', err.message);
            const status = err?.status || err?.code || err?.error?.code;
            if (status === 429) return res.status(429).json({ error: 'AI rate-limited. Please retry shortly.' });
            if (status === 503) return res.status(503).json({ error: 'AI temporarily unavailable. Please retry shortly.' });
            res.status(500).json({ error: 'Live check failed' });
        }
    }
);

app.post(
    ['/api/ai/explain-diff', '/ai/explain-diff'],
    requireAuthIfConfigured,
    aiLimiter,
    ensureTextPayloadWithinLimit('oldCode', MAX_CODE_BYTES),
    ensureTextPayloadWithinLimit('newCode', MAX_CODE_BYTES),
    async (req, res) => {
        const { oldCode, newCode } = req.body;
        if (!oldCode || !newCode) return res.status(400).json({ error: 'oldCode and newCode required' });
        try {
            const explanation = await aiServices.explainDiff(oldCode, newCode);
            res.json({ explanation });
        } catch (err) {
            console.error('Explain diff error:', err.message);
            const status = err?.status || err?.code || err?.error?.code;
            if (status === 429) return res.status(429).json({ error: 'AI rate-limited. Please retry shortly.' });
            if (status === 503) return res.status(503).json({ error: 'AI temporarily unavailable. Please retry shortly.' });
            res.status(500).json({ error: 'Diff explanation failed' });
        }
    }
);

app.post(
    ['/api/ai/debug-fix', '/ai/debug-fix'],
    requireAuthIfConfigured,
    aiLimiter,
    ensureTextPayloadWithinLimit('code', MAX_CODE_BYTES),
    ensureTextPayloadWithinLimit('errorOutput', MAX_ERROR_OUTPUT_BYTES),
    async (req, res) => {
        const { code, errorOutput, language } = req.body;
        if (!code || !errorOutput) return res.status(400).json({ error: 'code and errorOutput required' });
        try {
            const result = await aiServices.debugFix(code, errorOutput, language || 'javascript');
            res.json(result);
        } catch (err) {
            console.error('Debug fix error:', err.message);
            const status = err?.status || err?.code || err?.error?.code;
            if (status === 429) return res.status(429).json({ error: 'AI rate-limited. Please retry shortly.' });
            if (status === 503) return res.status(503).json({ error: 'AI temporarily unavailable. Please retry shortly.' });
            res.status(500).json({ error: 'Debug fix failed' });
        }
    }
);

app.post(
    ['/api/ai/visualize', '/ai/visualize'],
    requireAuthIfConfigured,
    aiLimiter,
    ensureTextPayloadWithinLimit('code', MAX_CODE_BYTES),
    async (req, res) => {
        const { code, language } = req.body;
        if (!code) return res.status(400).json({ error: 'code required' });
        try {
            const diagram = await aiServices.visualizeCode(code, language || 'javascript');
            res.json({ diagram });
        } catch (err) {
            console.error('Visualize error:', err.message);
            const status = err?.status || err?.code || err?.error?.code;
            if (status === 429) return res.status(429).json({ error: 'AI rate-limited. Please retry shortly.' });
            if (status === 503) return res.status(503).json({ error: 'AI temporarily unavailable. Please retry shortly.' });
            res.status(500).json({ error: 'Visualization failed' });
        }
    }
);

app.post(
    ['/api/code/run', '/code/run'],
    requireAuthIfConfigured,
    executionLimiter,
    ensureTextPayloadWithinLimit('code', MAX_CODE_BYTES),
    async (req, res) => {
        const { code, language } = req.body;
        if (!code) return res.status(400).send('Code is required');

        try {
            const axios = require('axios');
            const runnerUrl = process.env.RUNNER_URL || 'http://runner:3001';
            const response = await axios.post(`${runnerUrl}/run`, {
                code,
                language: language || 'javascript'
            }, { timeout: 15000 });

            res.json(response.data);
        } catch (err) {
            const allowLocalFallback =
                process.env.ALLOW_LOCAL_EXECUTION_FALLBACK === 'true';

            if (allowLocalFallback && (language === 'javascript' || !language)) {
                console.warn('Runner unavailable, using non-production local JS fallback.');
                const { spawn } = require('child_process');
                const child = spawn('node', ['-e', code]);

                let output = '';
                let stderr = '';

                child.stdout.on('data', data => output += data.toString());
                child.stderr.on('data', data => stderr += data.toString());

                const result = await new Promise((resolve) => {
                    child.on('close', exitCode => {
                        resolve({
                            output: output.split('\n').filter(Boolean),
                            stderr: stderr.split('\n').filter(Boolean),
                            exitCode
                        });
                    });

                    setTimeout(() => {
                        child.kill();
                        resolve({ output: [output], stderr: ['Execution timed out'], exitCode: 124 });
                    }, 5000);
                });

                return res.json(result);
            }

            console.error('Execution Service Error:', err.message);
            res.status(503).json({
                output: ['Code execution service is currently unavailable.'],
                stderr: [err.message],
                exitCode: 1
            });
        }
    }
);

app.use(express.static(path.join(__dirname, '../../Frontend/dist')));

app.get(['/api/health', '/health'], (req, res) => {
    res.json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        groq_api_key: process.env.GROQ_API_KEY ? 'present' : 'missing',
        auth_required: isAuthRequired(),
        jwt_configured: Boolean(process.env.JWT_SECRET),
        uptime_seconds: Math.round((Date.now() - startedAt) / 1000),
        time: new Date().toISOString()
    });
});

app.get(['/api/metrics', '/metrics'], (req, res) => {
    res.json({
        uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
        requests: requestMetrics,
        memory: process.memoryUsage(),
        mongodbReadyState: mongoose.connection.readyState
    });
});

app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, '../../Frontend/dist/index.html');
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send('CodeNest Backend - Running (Frontend not built)');
    }
});

module.exports = app;
