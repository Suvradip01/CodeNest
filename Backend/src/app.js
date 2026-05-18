const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Connect to Database
const connectDB = require('./db/db');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const aiRoutes = require('./routes/ai.routes');
const codeRoutes = require('./routes/code.routes');
const healthRoutes = require('./routes/health.routes');

// Import Middleware
const { requireAuthIfConfigured, isAuthRequired } = require('./middleware/auth');
const { projectLimiter } = require('./middleware/rateLimiter');
const { requestLogger } = require('./middleware/logger');

// Initialize database
connectDB();

if (isAuthRequired() && !process.env.JWT_SECRET) {
    console.warn('JWT_SECRET is not set. Falling back to the development signing secret.');
}

const app = express();

function getCorsOrigin() {
    const configured = String(process.env.CORS_ORIGIN || '').trim();
    if (!configured) return true;
    return configured.split(',').map(value => value.trim()).filter(Boolean);
}

// Global Middleware
app.use(cors({ origin: getCorsOrigin() }));
app.use(cookieParser());
app.use(express.json({ limit: process.env.MAX_JSON_BODY || '256kb' }));
app.use(requestLogger);

// Setup Routes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes); // Maintain backwards compatibility

app.use('/api/projects', requireAuthIfConfigured, projectLimiter, projectRoutes);
app.use('/projects', requireAuthIfConfigured, projectLimiter, projectRoutes); // Maintain backwards compatibility

app.use('/api/ai', aiRoutes);
app.use('/ai', aiRoutes); // Maintain backwards compatibility

app.use('/api/code', codeRoutes);
app.use('/code', codeRoutes); // Maintain backwards compatibility

app.use('/api', healthRoutes);
app.use('/', healthRoutes); // Maps /health and /metrics

// Serve Static Frontend
app.use(express.static(path.join(__dirname, '../../Frontend/dist')));

// Fallback Route
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
