const mongoose = require('mongoose');
const { startedAt, requestMetrics } = require('../utils/metrics');
const { isAuthRequired } = require('../middleware/auth');

exports.checkHealth = (req, res) => {
    res.json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        groq_api_key: process.env.GROQ_API_KEY ? 'present' : 'missing',
        auth_required: isAuthRequired(),
        jwt_configured: Boolean(process.env.JWT_SECRET),
        uptime_seconds: Math.round((Date.now() - startedAt) / 1000),
        time: new Date().toISOString()
    });
};

exports.getMetrics = (req, res) => {
    res.json({
        uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
        requests: requestMetrics,
        memory: process.memoryUsage(),
        mongodbReadyState: mongoose.connection.readyState
    });
};
