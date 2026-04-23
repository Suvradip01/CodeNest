const express = require('express')
const aiRoutes = require('./routes/ai.routes')
const projectRoutes = require('./routes/project.routes')
const cors = require('cors')
const aiServices = require('./services/ai.services')

const path = require('path')

const app = express()

// Allow requests from the frontend
app.use(cors())

// Parse JSON bodies
app.use(express.json())

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, '../../Frontend/dist')))

app.get('/', (req, res) => {
    // If we're in production and the file exists, send index.html
    const indexPath = path.join(__dirname, '../../Frontend/dist/index.html')
    const fs = require('fs')
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath)
    } else {
        res.send('CodeNest Backend — Running (Frontend not built)')
    }
})

// ─── Project Management Endpoints (Disk-based) ─────────────────────────────
app.use('/projects', projectRoutes)

// ─── Existing AI endpoints ─────────────────────────────────────────────────
app.post('/ai/get-review', aiRoutes.getReview)
app.post('/ai/edit-code', aiRoutes.editCode)

// ─── Feature 1: Live AI Layer ──────────────────────────────────────────────
app.post('/ai/live-check', async (req, res) => {
    const { code, language } = req.body
    if (!code || !code.trim()) return res.json({ warnings: [], suggestions: [], complexity: 'Simple' })
    try {
        const result = await aiServices.liveCheck(code, language || 'javascript')
        res.json(result)
    } catch (err) {
        console.error('Live check error:', err.message)
        const status = err?.status || err?.code || err?.error?.code
        if (status === 429) return res.status(429).json({ error: 'AI rate-limited. Please retry shortly.' })
        if (status === 503) return res.status(503).json({ error: 'AI temporarily unavailable. Please retry shortly.' })
        res.status(500).json({ error: 'Live check failed' })
    }
})

// ─── Feature 3: Versioning — Explain Diff ─────────────────────────────────
app.post('/ai/explain-diff', async (req, res) => {
    const { oldCode, newCode } = req.body
    if (!oldCode || !newCode) return res.status(400).json({ error: 'oldCode and newCode required' })
    try {
        const explanation = await aiServices.explainDiff(oldCode, newCode)
        res.json({ explanation })
    } catch (err) {
        console.error('Explain diff error:', err.message)
        const status = err?.status || err?.code || err?.error?.code
        if (status === 429) return res.status(429).json({ error: 'AI rate-limited. Please retry shortly.' })
        if (status === 503) return res.status(503).json({ error: 'AI temporarily unavailable. Please retry shortly.' })
        res.status(500).json({ error: 'Diff explanation failed' })
    }
})

// ─── Feature 4: AI Debug Mode ─────────────────────────────────────────────
app.post('/ai/debug-fix', async (req, res) => {
    const { code, errorOutput, language } = req.body
    if (!code || !errorOutput) return res.status(400).json({ error: 'code and errorOutput required' })
    try {
        const result = await aiServices.debugFix(code, errorOutput, language || 'javascript')
        res.json(result)
    } catch (err) {
        console.error('Debug fix error:', err.message)
        const status = err?.status || err?.code || err?.error?.code
        if (status === 429) return res.status(429).json({ error: 'AI rate-limited. Please retry shortly.' })
        if (status === 503) return res.status(503).json({ error: 'AI temporarily unavailable. Please retry shortly.' })
        res.status(500).json({ error: 'Debug fix failed' })
    }
})

// ─── Feature 5: Visual Execution ──────────────────────────────────────────
app.post('/ai/visualize', async (req, res) => {
    const { code, language } = req.body
    if (!code) return res.status(400).json({ error: 'code required' })
    try {
        const diagram = await aiServices.visualizeCode(code, language || 'javascript')
        res.json({ diagram })
    } catch (err) {
        console.error('Visualize error:', err.message)
        const status = err?.status || err?.code || err?.error?.code
        if (status === 429) return res.status(429).json({ error: 'AI rate-limited. Please retry shortly.' })
        if (status === 503) return res.status(503).json({ error: 'AI temporarily unavailable. Please retry shortly.' })
        res.status(500).json({ error: 'Visualization failed' })
    }
})

// ─── Code Execution Runner (Isolated Service) ────────────────────────
app.post('/code/run', async (req, res) => {
    const { code, language } = req.body
    if (!code) return res.status(400).send('Code is required')

    try {
        const axios = require('axios')
        // We call the 'runner' service which is isolated in docker-compose
        const response = await axios.post('http://runner:3001/run', {
            code,
            language: language || 'javascript'
        }, { timeout: 10000 })

        res.json(response.data)
    } catch (err) {
        console.error('Execution Service Error:', err.message)
        res.status(500).json({
            output: ['Code execution service is currently unavailable.'],
            stderr: [err.message],
            exitCode: 1
        })
    }
})

module.exports = app
