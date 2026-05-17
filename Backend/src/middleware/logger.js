const crypto = require('crypto');
const { requestMetrics } = require('../utils/metrics');

const requestLogger = (req, res, next) => {
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
};

module.exports = { requestLogger };
